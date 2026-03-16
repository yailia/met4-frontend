<script>
  let name = '';
  let email = '';
  let company = '';
  let position = '';
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
          type: 'webinar',
          name,
          email,
          company,
          position,
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

<div class="webinar-form glass-card">
  {#if submitted}
    <div class="success-message">
      <h3>Спасибо за регистрацию!</h3>
      <p>Мы отправили вам подтверждение на указанный email. До встречи на вебинаре!</p>
    </div>
  {:else}
    <h3>Регистрация на вебинар</h3>
    <p class="form-description">
      "Почему устойчивость = деньги"
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
        <label for="company">Компания</label>
        <input
          type="text"
          id="company"
          bind:value={company}
          placeholder="Название компании"
        />
      </div>

      <div class="form-group">
        <label for="position">Должность</label>
        <input
          type="text"
          id="position"
          bind:value={position}
          placeholder="Ваша должность"
        />
      </div>

      <button type="submit" class="button-primary" disabled={submitting}>
        {submitting ? 'Отправка...' : 'Зарегистрироваться'}
      </button>
    </form>
  {/if}
</div>

<style>
  .webinar-form {
    max-width: 500px;
    margin: 0 auto;
  }

  .webinar-form h3 {
    margin-bottom: var(--spacing-sm);
    text-align: center;
  }

  .form-description {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    font-weight: var(--fw-medium);
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
