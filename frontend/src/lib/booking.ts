// Booking configuration and slot generation.
// Moscow time is a fixed UTC+3 offset (no DST since 2014).
export const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

// ─── Webinar: edit these to move the recurring webinar ───
export const WEBINAR_WEEKDAY = 3; // 0=Sun … 3=Wed
export const WEBINAR_HOUR = 17; // MSK
export const WEBINAR_MINUTE = 0;
export const WEBINAR_WEEKS_AHEAD = 6;

// ─── Meeting availability (working days) ───
export const MEETING_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
export const MEETING_START_HOUR = 9; // MSK
export const MEETING_END_HOUR = 19; // last slot starts before this (so 18:30 is last)
export const MEETING_SLOT_MIN = 30;
export const MEETING_DAYS_COUNT = 10; // how many upcoming working days to offer
export const MEETING_LEAD_MS = 60 * 60 * 1000; // minimum lead time before a slot

// A Date whose UTC fields equal the current Moscow wall-clock.
function mskNow(): Date {
  return new Date(Date.now() + MSK_OFFSET_MS);
}

// Convert a Moscow wall-clock time to a real epoch (ms).
function mskWallToEpoch(y: number, mo: number, d: number, h: number, mi: number): number {
  return Date.UTC(y, mo, d, h, mi, 0) - MSK_OFFSET_MS;
}

export function fmtDay(epoch: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(epoch));
}

export function fmtTime(epoch: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epoch));
}

export function fmtFull(epoch: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epoch));
}

// Upcoming webinar slots (recurring weekday at fixed MSK time).
export function webinarSlots(): number[] {
  const now = mskNow();
  const out: number[] = [];
  for (let i = 0; out.length < WEBINAR_WEEKS_AHEAD && i < 7 * (WEBINAR_WEEKS_AHEAD + 1); i++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    if (day.getUTCDay() !== WEBINAR_WEEKDAY) continue;
    const epoch = mskWallToEpoch(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      WEBINAR_HOUR,
      WEBINAR_MINUTE
    );
    if (epoch > Date.now()) out.push(epoch);
  }
  return out;
}

export interface MeetingDay {
  epochs: number[]; // available slots for this working day
}

// Upcoming working days, each with its available time slots.
export function meetingDays(): MeetingDay[] {
  const now = mskNow();
  const days: MeetingDay[] = [];
  for (let i = 0; days.length < MEETING_DAYS_COUNT && i < MEETING_DAYS_COUNT + 14; i++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    if (!MEETING_DAYS.includes(day.getUTCDay())) continue;
    const epochs: number[] = [];
    for (let h = MEETING_START_HOUR; h < MEETING_END_HOUR; h++) {
      for (let mi = 0; mi < 60; mi += MEETING_SLOT_MIN) {
        const epoch = mskWallToEpoch(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, mi);
        if (epoch > Date.now() + MEETING_LEAD_MS) epochs.push(epoch);
      }
    }
    if (epochs.length) days.push({ epochs });
  }
  return days;
}
