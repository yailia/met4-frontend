// Counter id is public (visible in page source anyway).
// PUBLIC_METRIKA_ID env var overrides it; unset/empty falls back to the default,
// set PUBLIC_METRIKA_ID=0 to disable the counter (e.g. staging).
const raw = import.meta.env.PUBLIC_METRIKA_ID;
export const METRIKA_ID = Number(raw || '110554784') || 0;

export function reachGoal(goal: string): void {
  const w = window as unknown as { ym?: (id: number, action: string, goal: string) => void };
  if (METRIKA_ID && typeof w.ym === 'function') {
    w.ym(METRIKA_ID, 'reachGoal', goal);
  }
}
