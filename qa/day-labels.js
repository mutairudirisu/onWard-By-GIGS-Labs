// Day labels and time strings the new timeline cards show, exercised against the
// compiled lib/dates.ts. Run: node qa/day-labels.js
const Module = require("module");
const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/lib/data") return { BASE_DATE: "2026-10-28" };
  return load.call(this, request, parent, isMain);
};

const { dayHeading, formatTimeOf, formatStamp, toISO } = require("./dt/dates.js");

const now = new Date(2026, 10, 3, 9, 19); // 3 Nov 2026, 09:19 local
const iso = (d) => toISO(d);
const daysAgo = (n) => iso(new Date(2026, 10, 3 - n, 9, 19));

const checks = [
  [dayHeading(daysAgo(0), now), "Today, 3 Nov"],
  [dayHeading(daysAgo(1), now), "Yesterday, 2 Nov"],
  [dayHeading(daysAgo(2), now), "Sun, 1 Nov"],
  [dayHeading(daysAgo(7), now), "Tue, 27 Oct"],
  [dayHeading(daysAgo(20), now), "14 Oct"],
  [dayHeading("2025-12-25", now), "25 Dec 2025"],
  [formatTimeOf("2026-11-03T09:19:00"), "9:19 AM"],
  [formatTimeOf("2026-11-03T00:05:00"), "12:05 AM"],
  [formatTimeOf("2026-11-03T13:07:00"), "1:07 PM"],
  [formatStamp("2026-11-03T09:19:00"), "3 Nov 2026 · 9:19 AM"],
];

let failed = 0;
checks.forEach(([got, want], i) => {
  if (got !== want) {
    failed += 1;
    console.log(`FAIL ${i}: ${JSON.stringify(got)} !== ${JSON.stringify(want)}`);
  }
});
console.log(failed ? `${failed} of ${checks.length} failed` : `${checks.length} day labels ok`);
