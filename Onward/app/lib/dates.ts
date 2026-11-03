import { BASE_DATE } from "@/lib/data";

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

export function isSameDay(a: string, b: string) {
  return a === b;
}

export function isToday(iso: string) {
  return iso === BASE_DATE;
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

export function formatTasksHeader(iso: string) {
  const d = parseISO(iso);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "26 Oct" — the day a task falls due, short enough to sit under a title. */
export function formatDue(iso: string) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "9:15 PM" from the stored 24-hour "09:15". */
export function formatClock(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m ?? 0).padStart(2, "0")} ${ap}`;
}

/** When the task stops being doable — a known hour, or the end of its day. */
export function formatExpiry(iso: string, time?: string) {
  return `${formatDue(iso)} · ${time ? formatClock(time) : "by end of day"}`;
}

/** "9:19 AM" on its own — enough for the pill in the corner of a card. */
export function formatTimeOf(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}

/** "1 Nov 2026 · 9:19 AM" from a full ISO timestamp. */
export function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = formatTimeOf(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()} · ${time}`;
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

/**
 * The instant a wall-clock reminder actually falls due, as UTC ISO. A reminder is
 * picked as "Fri, 6 Nov at 9:45 AM", and AM means *this device's* morning — so the
 * conversion belongs on the device. The server only compares the result to now().
 */
export function reminderInstant(date?: string | null, time?: string | null): string | null {
  if (!date || !time) return null;
  const ms = Date.parse(`${date}T${time}:00`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** A stored instant split back into the { date, time } the picker shows. */
export function reminderParts(iso?: string | null): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date: toISO(d), time };
}

/** "Fri, 6 Nov · 9:45 AM" — the one line a stored reminder is shown as. */
export function formatReminder(iso: string) {
  const parts = reminderParts(iso);
  return parts ? `${formatTasksHeader(parts.date)} · ${formatClock(parts.time)}` : "";
}

/** "9:45 AM" when it falls today, "06 Nov · 9:45 AM" otherwise — short enough for a pill. */
export function formatReminderBrief(iso: string, now = new Date()) {
  const parts = reminderParts(iso);
  if (!parts) return "";
  const time = formatTimeOf(iso);
  return parts.date === toISO(now) ? time : `${formatDue(parts.date)} · ${time}`;
}

export function reminderPassed(iso: string, now = new Date()) {
  const at = Date.parse(iso);
  return !Number.isNaN(at) && at <= now.getTime();
}

/** The same reminder pushed forward by n minutes. */
export function laterInstant(iso: string, minutes: number): string {
  const at = Date.parse(iso);
  return Number.isNaN(at) ? iso : new Date(at + minutes * 60_000).toISOString();
}

export type DueState = "Expired" | "Due today" | "Tomorrow" | "Upcoming";

/** Where a due date sits against the real clock, not the mock "today". */
export function dueState(iso: string, time?: string, now = new Date()): DueState {
  const today = toISO(now);
  if (iso < today) return "Expired";
  if (iso === today) {
    if (time) {
      const [h, m] = time.split(":").map(Number);
      if (h * 60 + (m ?? 0) < now.getHours() * 60 + now.getMinutes()) return "Expired";
    }
    return "Due today";
  }
  if (iso === addDays(today, 1)) return "Tomorrow";
  return "Upcoming";
}

// onWard timeline label relative to the mock "today".
export function wardDateLabel(iso: string) {
  const d = parseISO(iso);
  const base = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;
  if (iso === BASE_DATE) return `${base} · TODAY`;
  return `${base} · ${WD[d.getDay()].toUpperCase()}`;
}

export type WeekCell = { iso: string; inMonth: boolean };

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
