# МЭТЧ - Проект устойчивости команд

Проект для повышения эффективности компании через развитие устойчивости команд.

## Структура проекта

- `frontend/` - Astro фронтенд приложение
- `bot/` - Telegram бот (не деплоится, legacy)
- `api/` - Hono API (сессии Q12, ответы, отчёты, заявки с форм)
- `docker-compose.yml` - Оркестрация контейнеров

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- Telegram бот токен (получить через [@BotFather](https://t.me/botfather))

### Настройка

1. Скопируйте `.env.example` в `.env` и заполните:
   ```env
   RESEND_KEY=your_resend_api_key
   LEAD_INBOX=owner@example.com
   ```

2. Для получения CHAT_ID используйте [@userinfobot](https://t.me/userinfobot) в Telegram

### Запуск через Docker

```bash
docker-compose up -d
```

Сайт будет доступен по адресу: http://localhost

### Деплой на VPS

Первый деплой (или после смены владельца тома sqlite):

```bash
# API-контейнер работает от user node, но том /data создан root.
# Один раз после создания тома — отдать права:
docker compose run --rm --user root api chown -R node:node /data

# Затем обычный запуск:
docker compose up -d --build api
docker compose restart nginx

# Проверка:
docker compose exec nginx nginx -t
curl -s https://api.met4.ru/health   # ожидается {"ok":true}
```

Переменные окружения в `.env` на VPS:

```env
RESEND_KEY=your_resend_api_key
LEAD_INBOX=bolkunatz@gmail.com
```

Яндекс.Метрика (`PUBLIC_METRIKA_ID`) настраивается **не на VPS**: счётчик вшивается
в статику фронтенда при сборке в CI. Задаётся в GitHub → Settings → Secrets and
variables → Actions → Variables → `PUBLIC_METRIKA_ID` (см. `.github/workflows/deploy.yml`).
Не задана — сайт собирается без счётчика.

### Локальная разработка

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Bot

```bash
cd bot
npm install
npm start
```

Не забудьте создать `.env` файлы в каждой папке с соответствующими переменными.

## Технологии

- **Frontend**: Astro + Svelte
- **Backend**: Node.js + Express + Telegraf
- **Deployment**: Docker + Docker Compose + Nginx

## Структура сайта

- `/` - Главная страница
- `/assessment` - Страница оценки (тест Q12)
- `/webinar` - Регистрация на вебинар
- `/products` - Продукты и услуги
- `/blog` - Блог
- `/gallery` - Галерея

## API

### POST /api/submit

Принимает данные форм и отправляет уведомления в Telegram.

Типы запросов:
- `contact` - контактная форма
- `assessment` - результаты теста Q12
- `webinar` - регистрация на вебинар

## Лицензия

MIT
