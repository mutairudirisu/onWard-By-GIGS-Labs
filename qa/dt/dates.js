"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseISO = parseISO;
exports.toISO = toISO;
exports.addDays = addDays;
exports.startOfWeek = startOfWeek;
exports.isSameDay = isSameDay;
exports.isToday = isToday;
exports.weekdayLetter = weekdayLetter;
exports.dayNum = dayNum;
exports.formatLong = formatLong;
exports.formatMedium = formatMedium;
exports.formatTasksHeader = formatTasksHeader;
exports.formatDue = formatDue;
exports.formatClock = formatClock;
exports.formatExpiry = formatExpiry;
exports.formatTimeOf = formatTimeOf;
exports.formatStamp = formatStamp;
exports.dayHeading = dayHeading;
exports.dueState = dueState;
exports.wardDateLabel = wardDateLabel;
exports.weekOf = weekOf;
exports.monthGrid = monthGrid;
exports.monthTitle = monthTitle;
const data_1 = require("@/lib/data");
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}
function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function addDays(iso, n) {
    const d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
}
// Monday-first start of the week containing `iso`.
function startOfWeek(iso) {
    const d = parseISO(iso);
    const shift = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    d.setDate(d.getDate() - shift);
    return toISO(d);
}
function isSameDay(a, b) {
    return a === b;
}
function isToday(iso) {
    return iso === data_1.BASE_DATE;
}
function weekdayLetter(iso) {
    return WD[parseISO(iso).getDay()][0];
}
function dayNum(iso) {
    return parseISO(iso).getDate();
}
function formatLong(iso) {
    const d = parseISO(iso);
    const wd = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
    return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatMedium(iso) {
    const d = parseISO(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function formatTasksHeader(iso) {
    const d = parseISO(iso);
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
/** "26 Oct" — the day a task falls due, short enough to sit under a title. */
function formatDue(iso) {
    const d = parseISO(iso);
    return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
/** "9:15 PM" from the stored 24-hour "09:15". */
function formatClock(time) {
    const [h, m] = time.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m ?? 0).padStart(2, "0")} ${ap}`;
}
/** When the task stops being doable — a known hour, or the end of its day. */
function formatExpiry(iso, time) {
    return `${formatDue(iso)} · ${time ? formatClock(time) : "by end of day"}`;
}
/** "9:19 AM" on its own — enough for the pill in the corner of a card. */
function formatTimeOf(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    const h = d.getHours();
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}
/** "1 Nov 2026 · 9:19 AM" from a full ISO timestamp. */
function formatStamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    const time = formatTimeOf(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()} · ${time}`;
}
/**
 * The heading a day of entries sits under: "Today, 3 Nov", "Yesterday, 2 Nov",
 * "Mon, 27 Oct" while the week is still in reach, then the plain date.
 */
function dayHeading(iso, now = new Date()) {
    const d = parseISO(iso);
    const short = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    const today = toISO(now);
    if (iso === today)
        return `Today, ${short}`;
    if (iso === addDays(today, -1))
        return `Yesterday, ${short}`;
    if (iso > addDays(today, -8))
        return `${WD[d.getDay()]}, ${short}`;
    return d.getFullYear() === now.getFullYear() ? short : `${short} ${d.getFullYear()}`;
}
/** Where a due date sits against the real clock, not the mock "today". */
function dueState(iso, time, now = new Date()) {
    const today = toISO(now);
    if (iso < today)
        return "Expired";
    if (iso === today) {
        if (time) {
            const [h, m] = time.split(":").map(Number);
            if (h * 60 + (m ?? 0) < now.getHours() * 60 + now.getMinutes())
                return "Expired";
        }
        return "Due today";
    }
    if (iso === addDays(today, 1))
        return "Tomorrow";
    return "Upcoming";
}
// onWard timeline label relative to the mock "today".
function wardDateLabel(iso) {
    const d = parseISO(iso);
    const base = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;
    if (iso === data_1.BASE_DATE)
        return `${base} · TODAY`;
    return `${base} · ${WD[d.getDay()].toUpperCase()}`;
}
// The 7 days (Mon-first) of the week containing `iso`.
function weekOf(iso) {
    const start = parseISO(startOfWeek(iso));
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return { iso: toISO(d), inMonth: d.getMonth() === parseISO(iso).getMonth() };
    });
}
// Full month grid (Mon-first weeks) for the month containing `iso`.
function monthGrid(iso) {
    const d = parseISO(iso);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const weeks = [];
    const cur = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
        const row = [];
        for (let i = 0; i < 7; i++) {
            row.push({
                iso: toISO(cur),
                inMonth: cur.getMonth() === d.getMonth(),
            });
            cur.setDate(cur.getDate() + 1);
        }
        weeks.push(row);
        if (cur.getMonth() !== d.getMonth() && w >= 4)
            break;
    }
    return weeks;
}
function monthTitle(iso) {
    const d = parseISO(iso);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
