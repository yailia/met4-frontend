<script>
  import { onMount } from 'svelte';
  import { reachGoal } from '../lib/metrika';

  const API = import.meta.env.PUBLIC_API_URL;

  const QUESTIONS = [
    'Знаете ли вы, чего ожидает от вас работодатель?',
    'У вас есть материалы и инструменты для качественной работы?',
    'У вас есть возможность каждый день делать то, что вы умеете лучше всего?',
    'За последние 7 дней вы получали признание или похвалу за хорошую работу?',
    'Считаете ли вы, что ваш руководитель заботится о вас как о личности?',
    'Кто-нибудь на работе способствует вашему развитию?',
    'Учитывается ли ваша точка зрения?',
    'Миссия компании заставляет вас чувствовать, что ваша работа важна?',
    'Считают ли ваши коллеги своей обязанностью качественно выполнять работу?',
    'У вас есть лучший друг на работе?',
    'За последние полгода кто-нибудь говорил с вами о ваших успехах?',
    'В прошлом году у вас были возможности учиться и расти на работе?',
  ];

  let mode = 'loading';

  // create
  let company = '';
  let email = '';
  let creating = false;
  let shareLink = '';

  // take
  let hash = '';
  let idx = 0;
  let answers = Array(12).fill(null);
  let submitting = false;

  // report
  let reportData = null;
  let loadingReport = false;

  let errorMsg = '';

  function generateHash() {
    return crypto.randomUUID();
  }

  function getRespondentId() {
    let id = localStorage.getItem('met4-respondent-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('met4-respondent-id', id);
    }
    return id;
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    hash = params.get('h') || '';
    const report = params.get('report') === '1';

    if (!hash)        mode = 'create';
    else if (report)  { mode = 'report'; loadReport(); }
    else              mode = 'take';
  });

  // ── CREATE ─────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    creating = true;
    errorMsg = '';
    try {
      const h = generateHash();
      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: h, company, email }),
      });
      if (!res.ok) throw new Error(await res.text());

      const base = window.location.origin + (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      shareLink = `${base}/assessment?h=${h}`;
      hash = h;
      mode = 'shared';
      reachGoal('session_created');
    } catch (err) {
      errorMsg = 'Не удалось создать сессию. Попробуйте позже.';
      console.error(err);
    } finally {
      creating = false;
    }
  }

  // ── TAKE ───────────────────────────────────────────────
  function select(v) {
    answers[idx] = v;
    answers = [...answers];
  }

  async function go(d) {
    if (d > 0 && idx === 11) { await submitAnswers(); return; }
    idx = Math.max(0, Math.min(11, idx + d));
  }

  async function submitAnswers() {
    submitting = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, answers, respondentId: getRespondentId() }),
      });
      if (!res.ok) throw new Error(await res.text());
      mode = 'done';
      reachGoal('assessment_completed');
    } catch (err) {
      errorMsg = 'Не удалось отправить ответы. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }

  // ── REPORT ─────────────────────────────────────────────
  async function loadReport() {
    loadingReport = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API}/report/${hash}`);
      if (!res.ok) throw new Error(await res.text());
      reportData = await res.json();
      reachGoal('report_viewed');
    } catch (err) {
      errorMsg = 'Не удалось загрузить отчёт.';
      console.error(err);
    } finally {
      loadingReport = false;
    }
  }

  function verdict(pct) {
    if (pct > 70) return { label: 'Высокий уровень вовлечённости', cls: 'success' };
    if (pct >= 50) return { label: 'Удовлетворительный результат', cls: 'warning' };
    return { label: 'Критический уровень', cls: 'error' };
  }

  $: progress = Math.round(((idx + 1) / 12) * 100);
</script>

{#if mode === 'loading'}
  <div class="center"><div class="spinner"></div></div>

{:else if mode === 'create'}
  <div class="glass-container form-wrap">
    <h2>Создать диагностику для команды</h2>
    <p class="form-lead">Введите данные — пришлём ссылку для сотрудников и отчёт на email.</p>
    {#if errorMsg}<div class="error-msg">{errorMsg}</div>{/if}
    <form on:submit={handleCreate}>
      <label class="field">
        <span class="field-label">Название компании</span>
        <input class="field-input" bind:value={company} required placeholder="ООО Компания" />
      </label>
      <label class="field">
        <span class="field-label">Email HR / руководителя</span>
        <input class="field-input" type="email" bind:value={email} required placeholder="hr@company.ru" />
      </label>
      <button class="btn-primary full" type="submit" disabled={creating}>
        {creating ? 'Создаём...' : 'Создать ссылку для команды'}
      </button>

      <p class="form-consent">
        Нажимая кнопку, вы соглашаетесь с
        <a href="/privacy/">политикой обработки персональных данных</a>.
      </p>
    </form>
  </div>

{:else if mode === 'shared'}
  <div class="glass-container shared-wrap">
    <div class="check-icon">✓</div>
    <h2>Ссылка создана</h2>
    <p>Отправьте сотрудникам:</p>
    <div class="share-link-box">
      <code>{shareLink}</code>
      <button class="btn-copy" on:click={() => navigator.clipboard.writeText(shareLink)}>Копировать</button>
    </div>
    <p class="share-note">Ссылка на отчёт и инструкция отправлены на ваш email.</p>
  </div>

{:else if mode === 'take'}
  <div class="assessment-wrap">
    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" style="width: {progress}%"></div></div>
      <div class="progress-text">Вопрос {idx + 1} из 12</div>
    </div>
    <div class="glass-card question-card">
      <div class="question-text">{QUESTIONS[idx]}</div>
      <div class="answer-row">
        <button class="answer-btn" class:selected={answers[idx] === true}  on:click={() => select(true)}>Да</button>
        <button class="answer-btn neutral" class:selected={answers[idx] === false} on:click={() => select(false)}>Нет</button>
      </div>
      {#if errorMsg}<div class="error-msg">{errorMsg}</div>{/if}
      <div class="q-nav">
        {#if idx > 0}
          <button class="btn-secondary" on:click={() => go(-1)}>Назад</button>
        {:else}
          <span></span>
        {/if}
        <button class="btn-primary" disabled={answers[idx] === null || submitting} on:click={() => go(1)}>
          {idx === 11 ? (submitting ? 'Отправка...' : 'Завершить') : 'Далее'}
        </button>
      </div>
    </div>
  </div>

{:else if mode === 'done'}
  <div class="glass-container done-wrap">
    <div class="check-icon">✓</div>
    <h2>Спасибо!</h2>
    <p>Ваши ответы записаны. Руководитель получит сводный отчёт.</p>
  </div>

{:else if mode === 'report'}
  {#if loadingReport}
    <div class="center"><div class="spinner"></div></div>
  {:else if errorMsg}
    <div class="glass-container done-wrap"><p class="error-msg">{errorMsg}</p></div>
  {:else if reportData}
    <div class="report-wrap">
      <div class="glass-container report-card">
        <span class="eyebrow">Отчёт Q12 · {reportData.company}</span>
        <div class="report-meta">{reportData.count} {reportData.count === 1 ? 'ответ' : reportData.count < 5 ? 'ответа' : 'ответов'}</div>

        {#if reportData.count === 0}
          <p>Ещё никто не прошёл опрос. Отправьте ссылку сотрудникам.</p>
        {:else}
          {@const v = verdict(reportData.total)}
          <div class="result-pct result-{v.cls}">{reportData.total}%</div>
          <h2>{v.label}</h2>
          <div class="questions-grid">
            {#each reportData.byQuestion as q, i}
              <div class="q-row">
                <div class="q-num">{i + 1}</div>
                <div class="q-text">{QUESTIONS[i]}</div>
                <div class="q-bar-wrap">
                  <div class="q-bar" style="width:{q.pct}%;background:{q.pct>70?'var(--color-success)':q.pct>=50?'var(--color-warning)':'var(--color-error)'}"></div>
                </div>
                <div class="q-pct">{q.pct}%</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  .center { display:flex; justify-content:center; padding:48px 0; }
  .spinner {
    width:40px; height:40px; border-radius:50%;
    border:3px solid rgba(255,255,255,0.12); border-top-color:var(--color-accent);
    animation:spin .8s linear infinite;
  }
  @keyframes spin { to { transform:rotate(360deg); } }

  .form-wrap { max-width:560px; margin:0 auto; }
  .form-wrap h2 { color:#fff; margin-bottom:8px; text-align:center; }
  .form-lead { color:rgba(255,255,255,.85); font-size:14px; text-align:center; margin-bottom:24px; }

  .field { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
  .field-label { font-size:13px; font-weight:500; color:rgba(255,255,255,.85); }
  .field-input {
    padding:14px 16px; border:1px solid rgba(255,255,255,.12); border-radius:12px;
    background:rgba(255,255,255,.04); color:#fff; font-size:15px;
    font-family:inherit; outline:none; transition:border-color .15s; min-height:48px;
  }
  .field-input:focus { border-color:var(--color-accent); background:rgba(255,255,255,.06); }
  .field-input::placeholder { color:rgba(255,255,255,.6); }

  .btn-primary {
    background:var(--color-accent); color:#fff; border:none; border-radius:12px;
    padding:14px 24px; font-size:15px; font-weight:500; font-family:inherit;
    cursor:pointer; transition:all .2s; min-height:48px;
    display:inline-flex; align-items:center; justify-content:center;
  }
  .btn-primary.full { width:100%; margin-top:8px; }
  .btn-primary:hover { background:var(--color-accent-hover); transform:translateY(-1px); }
  .btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; }

  .btn-secondary {
    background:transparent; color:var(--color-accent); border:1px solid var(--color-accent);
    border-radius:12px; padding:13px 24px; font-size:15px; font-weight:500;
    font-family:inherit; cursor:pointer; transition:all .2s; min-height:48px;
    display:inline-flex; align-items:center; justify-content:center;
  }
  .btn-secondary:hover { background:rgba(150,105,216,.15); }

  .shared-wrap, .done-wrap { max-width:560px; margin:0 auto; text-align:center; }
  .shared-wrap h2, .done-wrap h2 { color:#fff; margin-bottom:12px; }
  .check-icon {
    width:56px; height:56px; border-radius:50%;
    background:rgba(63,143,107,.2); border:1px solid var(--color-success);
    color:var(--color-success); font-size:24px;
    display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
  }
  .share-link-box {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12);
    border-radius:12px; padding:14px 16px;
    display:flex; align-items:center; gap:12px; margin:16px 0; flex-wrap:wrap;
  }
  .share-link-box code { flex:1; font-size:13px; color:#d4b8ff; word-break:break-all; }
  .btn-copy {
    background:rgba(150,105,216,.15); border:1px solid rgba(150,105,216,.3);
    color:#d4b8ff; border-radius:8px; padding:8px 14px; font-size:13px;
    cursor:pointer; font-family:inherit; white-space:nowrap;
  }
  .btn-copy:hover { background:rgba(150,105,216,.25); }
  .share-note { font-size:13px; color:rgba(255,255,255,.6); margin-top:8px; }
  .done-wrap p { color:rgba(255,255,255,.85); }

  .assessment-wrap { max-width:700px; margin:0 auto; }
  .progress-wrap { margin-bottom:24px; }
  .progress-bar { height:8px; background:rgba(255,255,255,.08); border-radius:4px; overflow:hidden; margin-bottom:10px; }
  .progress-fill { height:100%; background:var(--color-accent); transition:width .3s; }
  .progress-text { text-align:center; font-size:13px; color:rgba(255,255,255,.6); }

  .question-card { padding:28px 24px; }
  @media(min-width:720px){ .question-card{ padding:48px; } }
  .question-text { font-size:17px; text-align:center; line-height:1.45; margin-bottom:32px; color:#fff; font-weight:500; }
  @media(min-width:720px){ .question-text{ font-size:22px; margin-bottom:40px; } }

  .answer-row { display:flex; gap:14px; justify-content:center; margin-bottom:28px; flex-wrap:wrap; }
  .answer-btn {
    min-width:120px; padding:14px 24px; border:2px solid rgba(255,255,255,.12);
    border-radius:12px; background:rgba(45,48,56,.65); color:#fff;
    font-size:16px; font-weight:500; cursor:pointer; transition:all .2s;
    font-family:inherit; min-height:52px;
  }
  @media(min-width:720px){ .answer-btn{ padding:20px 40px; font-size:18px; min-width:160px; } }
  .answer-btn:hover { border-color:var(--color-accent); background:rgba(150,105,216,.2); }
  .answer-btn.selected { background:var(--color-accent); border-color:var(--color-accent); }
  .answer-btn.neutral.selected { background:rgba(60,64,72,.85); border-color:rgba(255,255,255,.4); }

  .q-nav { display:flex; justify-content:space-between; align-items:center; gap:12px; }

  .report-wrap { max-width:820px; margin:0 auto; }
  .report-card { padding:40px; }
  @media(max-width:720px){ .report-card{ padding:24px 20px; } }
  .eyebrow { font-size:11px; letter-spacing:.10em; text-transform:uppercase; color:#d4b8ff; font-weight:700; display:inline-block; margin-bottom:8px; }
  .report-meta { font-size:13px; color:rgba(255,255,255,.6); margin-bottom:24px; }
  .result-pct { font-size:72px; font-weight:700; line-height:1; margin-bottom:12px; }
  .result-success { color:var(--color-success); }
  .result-warning { color:var(--color-warning); }
  .result-error   { color:var(--color-error); }
  .report-card h2 { color:#fff; margin-bottom:32px; }

  .questions-grid { display:flex; flex-direction:column; gap:12px; margin-top:32px; }
  .q-row { display:grid; grid-template-columns:28px 1fr 120px 44px; align-items:center; gap:12px; }
  @media(max-width:600px){ .q-row{ grid-template-columns:24px 1fr 80px 36px; gap:8px; } }
  .q-num { font-size:12px; color:rgba(255,255,255,.4); font-weight:600; text-align:right; }
  .q-text { font-size:13px; color:rgba(255,255,255,.85); line-height:1.4; }
  .q-bar-wrap { height:6px; background:rgba(255,255,255,.08); border-radius:999px; overflow:hidden; }
  .q-bar { height:100%; border-radius:999px; transition:width .5s ease; }
  .q-pct { font-size:13px; color:#fff; font-weight:600; text-align:right; }

  .error-msg {
    background:rgba(200,91,91,.15); border:1px solid var(--color-error);
    color:#ff9090; padding:12px 16px; border-radius:8px; margin-bottom:16px;
    font-size:14px; text-align:center;
  }
  .form-consent {
    margin-top: 14px;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255,255,255,0.6);
  }

  .form-consent a { color: #d4b8ff; }
</style>
