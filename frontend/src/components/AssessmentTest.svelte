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
    margin-bottom: 24px;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.08);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-size: 13px;
    color: rgba(255,255,255,0.6);
  }

  .test-content {
    padding: 28px 24px;
  }

  @media (min-width: 720px) { .test-content { padding: 48px; } }

  .question-text {
    font-size: 17px;
    margin-bottom: 32px;
    text-align: center;
    line-height: 1.45;
    color: #fff;
    font-weight: 500;
    margin-top: 0;
  }

  @media (min-width: 720px) {
    .question-text { font-size: 22px; margin-bottom: 40px; }
  }

  .answer-options {
    display: flex;
    gap: 14px;
    margin-bottom: 28px;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (min-width: 720px) {
    .answer-options { gap: 16px; margin-bottom: 32px; }
  }

  .answer-button {
    min-width: 120px;
    padding: 14px 24px;
    border: 2px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    background: rgba(45,48,56,0.65);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
    min-height: 52px;
  }

  @media (min-width: 720px) {
    .answer-button { padding: 20px 40px; font-size: 18px; min-width: 160px; }
  }

  .answer-button:hover {
    border-color: var(--color-accent);
    background: rgba(150,105,216,0.20);
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
    gap: 12px;
  }

  .test-navigation button {
    min-width: 100px;
  }

  .test-completed {
    text-align: center;
    padding: 48px 32px;
  }

  .test-completed h3 {
    color: var(--color-success);
    margin-bottom: 12px;
  }

  .error-message {
    background: var(--color-error);
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    text-align: center;
  }
</style>
