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
