<script>
  import { onMount } from 'svelte';
  import { reachGoal } from '../lib/metrika';
  import { webinarSlots, meetingDays, fmtDay, fmtTime, fmtFull } from '../lib/booking';

  export let kind = 'meeting'; // 'webinar' | 'meeting'

  const API_URL = import.meta.env.PUBLIC_API_URL;

  let step = 'slot'; // 'slot' | 'form' | 'done'
  let error = '';
  let submitting = false;

  let webinar = [];
  let days = [];
  let selectedDayIdx = 0;
  let selectedSlot = null;

  let name = '';
  let email = '';
  let company = '';
  let note = '';
  let website = '';

  onMount(() => {
    if (kind === 'webinar') {
      webinar = webinarSlots();
    } else {
      days = meetingDays();
    }
  });

  function pick(epoch) {
    selectedSlot = epoch;
    error = '';
    step = 'form';
  }

  function back() {
    selectedSlot = null;
    step = 'slot';
  }

  async function submit(e) {
    e.preventDefault();
    if (!selectedSlot) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch(`${API_URL}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, slot: selectedSlot, name, email, company, note, website }),
      });
      if (!res.ok) throw new Error('bad');
      reachGoal(kind === 'webinar' ? 'webinar_book' : 'meeting_book');
      step = 'done';
    } catch (err) {
      error = 'Не удалось забронировать. Попробуйте позже.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="booking glass-container">
  {#if step === 'slot'}
    <h3>{kind === 'webinar' ? 'Выберите дату вебинара' : 'Выберите удобное время'}</h3>

    {#if kind === 'webinar'}
      {#if webinar.length === 0}
        <p class="empty">Ближайшие даты уточняются — оставьте заявку через форму контактов.</p>
      {:else}
        <div class="slot-list">
          {#each webinar as epoch}
            <button type="button" class="slot-row" on:click={() => pick(epoch)}>
              <span>{fmtFull(epoch)} (МСК)</span>
              <span class="arrow">→</span>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      {#if days.length === 0}
        <p class="empty">Свободных слотов нет — оставьте заявку через форму контактов.</p>
      {:else}
        <div class="day-tabs">
          {#each days as d, i}
            <button
              type="button"
              class="day-tab"
              class:active={i === selectedDayIdx}
              on:click={() => (selectedDayIdx = i)}
            >
              {fmtDay(d.epochs[0])}
            </button>
          {/each}
        </div>
        <div class="time-grid">
          {#each days[selectedDayIdx].epochs as epoch}
            <button type="button" class="time-chip" on:click={() => pick(epoch)}>{fmtTime(epoch)}</button>
          {/each}
        </div>
      {/if}
    {/if}
  {:else if step === 'form'}
    <button type="button" class="back" on:click={back}>← Изменить время</button>
    <div class="chosen">{fmtFull(selectedSlot)} (МСК)</div>

    {#if error}<div class="error-message">{error}</div>{/if}

    <form on:submit={submit}>
      <div class="hp-field" aria-hidden="true">
        <label for="bk-website">Website</label>
        <input type="text" id="bk-website" bind:value={website} tabindex="-1" autocomplete="off" />
      </div>
      <div class="form-group">
        <label for="bk-name">Имя *</label>
        <input id="bk-name" bind:value={name} required placeholder="Ваше имя" />
      </div>
      <div class="form-group">
        <label for="bk-email">Email *</label>
        <input id="bk-email" type="email" bind:value={email} required placeholder="your@email.com" />
      </div>
      <div class="form-group">
        <label for="bk-company">Компания</label>
        <input id="bk-company" bind:value={company} placeholder="Название компании" />
      </div>
      <div class="form-group">
        <label for="bk-note">Комментарий</label>
        <input id="bk-note" bind:value={note} placeholder="Что хотите обсудить (необязательно)" />
      </div>

      <button type="submit" class="button-primary" disabled={submitting}>
        {submitting ? 'Бронируем...' : 'Забронировать'}
      </button>

      <p class="form-consent">
        Нажимая кнопку, вы соглашаетесь с
        <a href="/privacy/">политикой обработки персональных данных</a>.
      </p>
    </form>
  {:else}
    <div class="done">
      <div class="check">✓</div>
      <h3>{kind === 'webinar' ? 'Вы записаны!' : 'Встреча забронирована!'}</h3>
      <p>Подтверждение и приглашение в календарь отправили на <strong>{email}</strong>.</p>
      <p class="chosen small">{fmtFull(selectedSlot)} (МСК)</p>
    </div>
  {/if}
</div>

<style>
  .booking {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 28px;
  }

  @media (max-width: 720px) {
    .booking { padding: 24px 18px; }
  }

  .booking h3 {
    color: #fff;
    text-align: center;
    margin: 0 0 20px;
    font-size: 20px;
  }

  .empty {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }

  .slot-list { display: flex; flex-direction: column; gap: 10px; }

  .slot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    font-size: 15px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease;
    min-height: 44px;
  }
  .slot-row:hover { border-color: var(--color-accent); background: rgba(150, 105, 216, 0.15); }
  .slot-row .arrow { color: #d4b8ff; }

  .day-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .day-tab {
    flex: 0 0 auto;
    padding: 10px 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    min-height: 44px;
  }
  .day-tab.active { border-color: var(--color-accent); background: rgba(150, 105, 216, 0.25); color: #fff; }

  .time-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 10px;
  }

  .time-chip {
    padding: 12px 8px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    font-size: 15px;
    font-family: inherit;
    cursor: pointer;
    min-height: 44px;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .time-chip:hover { border-color: var(--color-accent); background: rgba(150, 105, 216, 0.2); }

  .back {
    background: none;
    border: none;
    color: #d4b8ff;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    padding: 0 0 12px;
  }

  .chosen {
    text-align: center;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  .chosen.small { font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.8); margin: 8px 0 0; }

  .form-group { margin-bottom: 16px; }

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
    font-family: inherit;
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    min-height: 48px;
    outline: none;
  }
  input:focus { border-color: var(--color-accent); background: rgba(255, 255, 255, 0.06); }
  input::placeholder { color: rgba(255, 255, 255, 0.6); }

  .button-primary { width: 100%; margin-top: 8px; }
  .button-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .form-consent {
    margin-top: 14px;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
  }
  .form-consent a { color: #d4b8ff; }

  .hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

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

  .done { text-align: center; padding: 12px 0; }
  .check {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(63, 143, 107, 0.2);
    border: 2px solid var(--color-success);
    color: var(--color-success);
    font-size: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  .done p { color: rgba(255, 255, 255, 0.82); font-size: 15px; margin: 6px 0; }
</style>
