<script>
  let name = '';
  let email = '';
  let phone = '';
  let telegram = '';
  let submitted = false;
  let submitting = false;
  let error = '';

  const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

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
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки формы');
      }

      submitted = true;
    } catch (err) {
      error = 'Не удалось отправить форму. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="contact-form glass-card">
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
  .contact-form {
    max-width: 500px;
    margin: 0 auto;
  }

  .contact-form h3 {
    margin-bottom: var(--spacing-sm);
    text-align: center;
  }

  .form-description {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .form-group {
    margin-bottom: var(--spacing-lg);
  }

  label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: var(--fw-medium);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    font-size: var(--text-base);
    font-family: var(--font-sans);
    background: var(--color-surface);
    color: var(--color-text-primary);
    transition: border-color 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  input::placeholder {
    color: var(--color-text-muted);
  }

  button {
    width: 100%;
    margin-top: var(--spacing-md);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .success-message {
    text-align: center;
    padding: var(--spacing-xl);
  }

  .success-message h3 {
    color: var(--color-success);
    margin-bottom: var(--spacing-md);
  }

  .error-message {
    background: var(--color-error);
    color: #fff;
    padding: var(--spacing-md);
    border-radius: 8px;
    margin-bottom: var(--spacing-lg);
    font-size: var(--text-sm);
    text-align: center;
  }
</style>
