<script>
  import { reachGoal } from '../lib/metrika';

  let name = '';
  let email = '';
  let phone = '';
  let telegram = '';
  let submitted = false;
  let submitting = false;
  let error = '';

  let website = ''; // honeypot — real users never fill this

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

      submitted = true;
      reachGoal('contact_submit');
    } catch (err) {
      error = 'Не удалось отправить форму. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="contact-form">
  {#if submitted}
    <div class="success-message">
      <h3>Спасибо!</h3>
      <p>Ваши контакты получены. Мы свяжемся с вами в ближайшее время.</p>
    </div>
  {:else}
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

      <button type="submit" class="button-primary" disabled={submitting}>
        {submitting ? 'Отправка...' : 'Продолжить'}
      </button>
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
</style>
