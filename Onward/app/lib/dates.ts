const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today as the app keeps it: yyyy-mm-dd on the device you are holding. */
export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Monday-first start of the week containing `iso`.
export function startOfWeek(iso: string): string {
  const d = parseISO(iso);
  const shift = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - shift);
  return toISO(d);
}

export function weekdayLetter(iso: string) {
  return WD[parseISO(iso).getDay()][0];
}

export function dayNum(iso: string) {
  return parseISO(iso).getDate();
}

export function formatLong(iso: string) {
  const d = parseISO(iso);
  const wd = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatMedium(iso: string) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** "26 Oct" — the day an onWard happened, short enough to sit under a title. */
export function formatDue(iso: string) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/**
 * The heading a day of entries sits under: "Today, 3 Nov", "Yesterday, 2 Nov",
 * "Mon, 27 Oct" while the week is still in reach, then the plain date.
 */
export function dayHeading(iso: string, now = new Date()) {
  const d = parseISO(iso);
  const short = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const today = toISO(now);
  if (iso === today) return `Today, ${short}`;
  if (iso === addDays(today, -1)) return `Yesterday, ${short}`;
  if (iso > addDays(today, -8)) return `${WD[d.getDay()]}, ${short}`;
  return d.getFullYear() === now.getFullYear() ? short : `${short} ${d.getFullYear()}`;
}

// onWard timeline label relative to the real clock.
export function wardDateLabel(iso: string) {
  const d = parseISO(iso);
  const base = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;
  if (iso === todayISO()) return `${base} · TODAY`;
  return `${base} · ${WD[d.getDay()].toUpperCase()}`;
}

/** How long ago a feed item happened, the way a social timeline says it: "4h", "2d". */
export function timeAgo(stamp: string, now = Date.now()) {
  const then = new Date(stamp).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 31) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export type WeekCell = { iso: string; inMonth: boolean };

/** How long a poll has left, in the same breath as timeAgo: "42m", "6h", "3d". */
export function timeUntil(stamp: string, now = Date.now()) {
  const then = new Date(stamp).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((then - now) / 60000);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// The 7 days (Mon-first) of the week containing `iso`.
export function weekOf(iso: string): WeekCell[] {
  const start = parseISO(startOfWeek(iso));
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: toISO(d), inMonth: d.getMonth() === parseISO(iso).getMonth() };
  });
}

// Full month grid (Mon-first weeks) for the month containing `iso`.
export function monthGrid(iso: string): WeekCell[][] {
  const d = parseISO(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const weeks: WeekCell[][] = [];
  const cur = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const row: WeekCell[] = [];
    for (let i = 0; i < 7; i++) {
      row.push({
        iso: toISO(cur),
        inMonth: cur.getMonth() === d.getMonth(),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(row);
    if (cur.getMonth() !== d.getMonth() && w >= 4) break;
  }
  return weeks;
}

export function monthTitle(iso: string) {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
