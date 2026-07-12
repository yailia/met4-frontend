# Mailbot — @met4 email + leads into Telegram

Date: 2026-07-13
Todoist: 6h59xG9RRvv5RMMp

## Goal

Everything sent to any `@met4.ru` address, plus every form lead, lands in the
`@met4_main_bot` Telegram chat. The owner replies straight from Telegram; the
reply goes out as an email via the Rusender REST API.

## Scope (MVP)

- **Receive:** own SMTP server on the VPS, catch-all for `*@met4.ru`, forwards
  every message to the owner Telegram chat.
- **Reply:** owner replies (Telegram reply) to a forwarded message → bot sends an
  email through Rusender REST, `from = hello@met4.ru`, `Subject: Re: …`.
- **Leads:** `api` additionally pushes each form lead to the mailbot's internal
  `/lead` endpoint; the existing Gmail lead email stays as a backup.
- **Owner check:** `OWNER_CHAT_IDS` (hardcoded/env, starts `[152579925]`).
  Anything from a non-owner → reply `вы не владелец`.

## Key facts (verified)

- Rusender REST `from.email` must belong to the sending-key domain (`met4.ru`),
  so **any `@met4.ru` local-part works** with the existing key — no per-address
  password needed. `hello@met4.ru` is the MVP sender.
- Rusender `headers` accepts only custom `X-*` headers → `In-Reply-To`/`References`
  are **not** relied on. Threading is best-effort via `Subject: Re:`.
- Port 25 inbound on the VPS is currently CLOSED — the receive path is dark until
  the firewall is opened. The lead path (api → mailbot HTTP) works regardless.

## Architecture

New TS service `mailbot/` (mirrors `api/`: Hono + vitest + libsql).

Modules:

- `config.ts` — env: `BOT_TOKEN`, `OWNER_CHAT_IDS`, `RUSENDER_KEY`,
  `RUSENDER_KEY_ID`, `MAIL_DOMAIN=met4.ru`, `FROM_EMAIL=hello@met4.ru`,
  `FROM_NAME`, `INTERNAL_TOKEN`, `SMTP_PORT=2525`, `HTTP_PORT=3002`, `DB_PATH`,
  `TEXT_LIMIT`.
- `db.ts` — `threads(chat_id, tg_message_id, from_email, to_email, subject,
  message_id, created_at)`, PK `(chat_id, tg_message_id)`.
- `store.ts` — `saveThread` / `getThread`.
- `owner.ts` — `isOwner(id, owners)`.
- `format.ts` — `formatInbound`, `formatLead`, `replySubject`, HTML escaping.
- `mailer.ts` — `sendReply` via Rusender REST (from any `@met4.ru`).
- `smtp.ts` — `smtp-server`, catch-all `@met4.ru`, `mailparser`, `onMail`.
- `bot.ts` — Telegraf. Inbound → message to each owner + `saveThread`. Owner
  reply → look up thread → from-selection (1 address → send directly, N → inline
  buttons) → `sendReply` → confirm. `/id` returns the chat id (setup helper).
- `http.ts` — Hono: `POST /lead` (auth `x-internal-token`), `GET /health`.
- `index.ts` — wire, launch polling + SMTP + HTTP, graceful shutdown.

## Data flow

Inbound mail → SMTP (:2525, mapped from host :25) → parse → Telegram message to
owner + save thread. Owner reply → Rusender REST → email to original sender.

Lead → `api` `/api/submit` or `/api/book` → `POST mailbot /lead` → Telegram
message to owner (fire-and-forget, Gmail email unchanged).

## Deploy

- `mailbot` service in `docker-compose.yml`, `ports: 25:2525` (container listens
  on 2525 as non-root), shares Rusender creds.
- `deploy.yml`: build + run mailbot, sync `BOT_TOKEN` / `OWNER_CHAT_IDS` /
  `INTERNAL_TOKEN` / `MAILBOT_URL` into `.env`.
- Retire old `bot/` (Telegraf/JS, unused).
- Manual ops: open inbound port 25 on the VPS firewall (receive path).

## Testing (vitest)

`format`, `store`, `owner`, `mailer` (mock Rusender fetch), bot reply handler
(mock Telegraf ctx + mailer), SMTP receive (in-process client).

## Roadmap (post-MVP)

Mailbox registry (`can_receive` / `can_send` flags) → `создать ящик ilia`
command (instant receive) → per-mailbox from buttons (send gated on manual
Rusender verification).
