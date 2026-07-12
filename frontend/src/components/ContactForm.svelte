<script>
  import { reachGoal } from '../lib/metrika';

  let name = '';
  let email = '';
  let phone = '';
  let telegram = '';
  let submitting = false;
  let error = '';

  let website = '';
  let consent = false;

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
          type: 'contact',
          name,
          email,
          phone,
          telegram,
          website,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки формы');
      }

      reachGoal('contact_submit');
      window.location.href = '/thanks/';
    } catch (err) {
      error = 'Не удалось отправить форму. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="contact-form">
  <h3>Оставьте контакты</h3>
  <p class="form-description">
    Для получения результатов диагностики укажите ваши контактные данные
  </p>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}

    <form on:submit={handleSubmit}>
      <div class="hp-field" aria-hidden="true">
        <label for="website">Website</label>
        <input type="text" id="website" name="website" bind:value={website} tabindex="-1" autocomplete="off" />
      </div>
      <div class="form-group">
        <label for="name">Имя *</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          placeholder="Ваше имя"
        />
      </div>

      <div class="form-group">
        <label for="email">Email *</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          placeholder="your@email.com"
        />
      </div>

      <div class="form-group">
        <label for="phone">Телефон</label>
        <input
          type="tel"
          id="phone"
          bind:value={phone}
          placeholder="+7 (999) 123-45-67"
        />
      </div>

      <div class="form-group">
        <label for="telegram">Telegram</label>
        <input
          type="text"
          id="telegram"
          bind:value={telegram}
          placeholder="@username"
        />
      </div>

      <label class="form-consent">
        <input type="checkbox" bind:checked={consent} required />
        <span>Я согласен(на) с <a href="/privacy/">политикой обработки персональных данных</a></span>
      </label>

      <button type="submit" class="button-primary" disabled={submitting || !consent}>
        {submitting ? 'Отправка...' : 'Продолжить'}
      </button>
    </form>
</div>

<style>
  .hp-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .contact-form {
    width: 100%;
  }

  .contact-form h3 {
    margin-bottom: 8px;
    text-align: center;
    color: #fff;
  }

  .form-description {
    text-align: center;
    margin-bottom: 24px;
    color: rgba(255,255,255,0.85);
    font-size: 14px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
    font-size: 13px;
  }

  input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    font-size: 15px;
    font-family: var(--font-sans);
    background: rgba(255,255,255,0.04);
    color: #fff;
    transition: border-color 0.15s ease;
    min-height: 48px;
    outline: none;
  }

  input:focus {
    border-color: var(--color-accent);
    background: rgba(255,255,255,0.06);
  }

  input::placeholder {
    color: rgba(255,255,255,0.6);
  }

  button {
    width: 100%;
    margin-top: 16px;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .success-message {
    text-align: center;
    padding: 24px 0;
  }

  .success-message h3 {
    color: var(--color-success);
    margin-bottom: 10px;
  }

  .error-message {
    background: rgba(200,91,91,0.15);
    border: 1px solid var(--color-error);
    color: #ff9090;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }

  .form-consent {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 4px 0 14px;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
  }
  .form-consent input {
    width: 16px;
    height: 16px;
    min-height: auto;
    padding: 0;
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: var(--color-accent);
    cursor: pointer;
  }
  .form-consent a { color: #d4b8ff; }
</style>
