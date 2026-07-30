<script>
  import { reachGoal } from '../lib/metrika';

  export let guide = '';
  export let pdf = '';
  export let title = '';

  let name = '';
  let email = '';
  let submitting = false;
  let done = false;
  let error = '';

  let website = '';

  const API_URL = import.meta.env.PUBLIC_API_URL;

  async function handleSubmit(e) {
    e.preventDefault();
    submitting = true;
    error = '';

    try {
      const response = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'guide',
          guide,
          name,
          email,
          website,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки формы');
      }

      reachGoal('guide_submit');
      done = true;
    } catch (err) {
      error = 'Не удалось отправить форму. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="guide-form">
  {#if done}
    <div class="done">
      <h3>Путеводитель готов</h3>
      <p>Нажмите кнопку — PDF откроется в новой вкладке.</p>
      <a class="button-primary" href={pdf} target="_blank" rel="noopener" download>
        Скачать PDF
      </a>
    </div>
  {:else}
    <h3>Получить путеводитель</h3>
    <p class="form-description">{title}</p>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <form on:submit={handleSubmit}>
      <div class="hp-field" aria-hidden="true">
        <label for="website">Website</label>
        <input type="text" id="website" name="website" bind:value={website} tabindex="-1" autocomplete="off" />
      </div>

      <div class="form-group">
        <label for="guide-name">Имя *</label>
        <input type="text" id="guide-name" bind:value={name} required placeholder="Ваше имя" />
      </div>

      <div class="form-group">
        <label for="guide-email">Email *</label>
        <input type="email" id="guide-email" bind:value={email} required placeholder="your@email.com" />
      </div>

      <button type="submit" class="button-primary" disabled={submitting}>
        {submitting ? 'Отправка...' : 'Скачать путеводитель'}
      </button>

      <p class="consent">
        Нажимая кнопку, вы соглашаетесь с
        <a href="/privacy/" target="_blank" rel="noopener">политикой конфиденциальности</a>.
      </p>
    </form>
  {/if}
</div>

<style>
  .hp-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .guide-form {
    width: 100%;
  }

  .guide-form h3 {
    margin-bottom: 8px;
    color: #fff;
  }

  .form-description {
    margin-bottom: 24px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 15px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
  }

  input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    font-size: 15px;
    font-family: var(--font-sans);
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    transition: border-color 0.15s ease;
    min-height: 48px;
    outline: none;
  }

  input:focus {
    border-color: var(--color-accent);
    background: rgba(255, 255, 255, 0.06);
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  button {
    width: 100%;
    margin-top: 8px;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .consent {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
  }

  .consent a {
    color: rgba(255, 255, 255, 0.85);
  }

  .done {
    text-align: center;
    padding: 8px 0;
  }

  .done h3 {
    color: var(--color-success);
    margin-bottom: 8px;
  }

  .done p {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .done .button-primary {
    display: inline-block;
  }

  .error-message {
    background: rgba(200, 91, 91, 0.15);
    border: 1px solid var(--color-error);
    color: #ff9090;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }
</style>
