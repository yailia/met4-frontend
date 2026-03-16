<script>
  const questions = [
    'Знаете ли вы, чего ожидает от вас работодатель?',
    'У вас есть материалы и инструменты, необходимые для качественной работы?',
    'У вас есть возможность каждый день делать то, что вы умеете лучше всего?',
    'За последние семь дней вы получали признание или похвалу за хорошую работу?',
    'Считаете ли вы, что ваш руководитель или кто-то на работе заботится о вас как о личности?',
    'Кто-нибудь на работе способствует вашему развитию?',
    'Учитывается ли ваша точка зрения?',
    'Миссия и цель вашей компании заставляет вас чувствовать, что ваша работа важна?',
    'Считают ли ваши коллеги своей обязанностью качественно выполнять свою работу?',
    'У вас есть лучший друг на работе?',
    'За последние полгода кто-нибудь на работе говорил с вами о ваших успехах?',
    'В прошлом году у вас были возможности учиться и расти на работе?'
  ];

  let answers = Array(12).fill(null);
  let currentQuestion = 0;
  let completed = false;
  let submitting = false;
  let error = '';

  function selectAnswer(value) {
    answers[currentQuestion] = value;
  }

  function nextQuestion() {
    if (answers[currentQuestion] !== null) {
      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
      } else {
        completeTest();
      }
    }
  }

  function prevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
    }
  }

  const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

  async function completeTest() {
    submitting = true;
    error = '';

    try {
      const yesCount = answers.filter(a => a === true).length;
      const totalQuestions = questions.length;
      const percentage = Math.round((yesCount / totalQuestions) * 100);

      const response = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'assessment',
          answers,
          yesCount,
          totalQuestions,
          percentage,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки результатов');
      }

      completed = true;
    } catch (err) {
      error = 'Не удалось отправить результаты. Попробуйте позже.';
      console.error(err);
    } finally {
      submitting = false;
    }
  }

  function getProgress() {
    return Math.round(((currentQuestion + 1) / questions.length) * 100);
  }
</script>

<div class="assessment-test">
  {#if completed}
    <div class="test-completed glass-card">
      <h3>Спасибо за прохождение теста!</h3>
      <p>Ваши результаты отправлены. Мы свяжемся с вами для обсуждения результатов.</p>
    </div>
  {:else}
    <div class="test-header">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {getProgress()}%"></div>
      </div>
      <p class="progress-text">Вопрос {currentQuestion + 1} из {questions.length}</p>
    </div>

    <div class="test-content glass-card">
      <h3 class="question-text">{questions[currentQuestion]}</h3>

      <div class="answer-options">
        <button
          class="answer-button"
          class:selected={answers[currentQuestion] === true}
          on:click={() => selectAnswer(true)}
        >
          Да
        </button>
        <button
          class="answer-button"
          class:selected={answers[currentQuestion] === false}
          on:click={() => selectAnswer(false)}
        >
          Нет
        </button>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="test-navigation">
        {#if currentQuestion > 0}
          <button class="button-secondary" on:click={prevQuestion}>Назад</button>
        {:else}
          <div></div>
        {/if}
        <button
          class="button-primary"
          on:click={nextQuestion}
          disabled={answers[currentQuestion] === null || submitting}
        >
          {currentQuestion === questions.length - 1 ? (submitting ? 'Отправка...' : 'Завершить') : 'Далее'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .assessment-test {
    max-width: 700px;
    margin: 0 auto;
  }

  .test-header {
    margin-bottom: var(--spacing-xl);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--spacing-sm);
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .test-content {
    padding: var(--spacing-2xl);
  }

  .question-text {
    font-size: var(--text-lg);
    margin-bottom: var(--spacing-2xl);
    text-align: center;
    line-height: var(--lh-loose);
  }

  @media (min-width: 768px) {
    .question-text {
      font-size: var(--text-xl);
    }
  }

  .answer-options {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-2xl);
    flex-direction: column;
  }

  @media (min-width: 768px) {
    .answer-options {
      flex-direction: row;
      justify-content: center;
    }
  }

  .answer-button {
    flex: 1;
    padding: var(--spacing-lg) var(--spacing-xl);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-size: var(--text-lg);
    font-weight: var(--fw-medium);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
  }

  .answer-button:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .answer-button.selected {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }

  .test-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
  }

  .test-navigation button {
    min-width: 120px;
  }

  .test-completed {
    text-align: center;
    padding: var(--spacing-3xl);
  }

  .test-completed h3 {
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
