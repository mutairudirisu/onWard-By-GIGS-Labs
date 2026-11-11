// Scratch QA: measure horizontal overflow + heavy paint layers on a phone viewport
// over the Chrome DevTools Protocol. Usage: node qa/measure.mjs <cdp-port> <url-substring> <width>
const [port = "9223", match = "localhost:3002", width = "390", path = ""] = process.argv.slice(2);

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page" && t.url.includes(match));
if (!page) {
  console.log("NO PAGE. targets:", list.map((t) => `${t.type} ${t.url}`).join(" | "));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};

const expression = `(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const offenders = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    let clip = null;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX !== "visible") { clip = p.tagName + "." + String(p.className).split(" ").slice(0,3).join("."); break; }
    }
    offenders.push({
      el: el.tagName + "." + String(el.className).split(" ").slice(0,4).join("."),
      left: Math.round(r.left), right: Math.round(r.right),
      clippedBy: clip,
    });
  }
  const heavy = Array.from(document.querySelectorAll("body *")).filter((el) => {
    const s = getComputedStyle(el);
    return s.backdropFilter && s.backdropFilter !== "none";
  }).map((el) => el.tagName + "." + String(el.className).split(" ").slice(0,3).join(" "));
  const sources = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1) continue;
    const p = el.parentElement;
    if (!p) continue;
    const pr = p.getBoundingClientRect();
    if (pr.right > vw + 1) continue; // an ancestor already sticks out
    const ps = getComputedStyle(p);
    if (ps.overflowX !== "visible") continue; // the parent clips it
    sources.push({
      el: el.tagName + "." + String(el.className).split(" ").slice(0, 5).join("."),
      parent: p.tagName + "." + String(p.className).split(" ").slice(0, 3).join("."),
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      text: (el.textContent || "").trim().slice(0, 40),
    });
  }
  return JSON.stringify({ vw, scrollWidth: sw, overflow: sw - vw, sources: sources.slice(0, 20), heavyCount: heavy.length, heavy: heavy.slice(0, 8) });
})()`;

await new Promise((resolve) => (ws.onopen = resolve));
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
if (path) {
  await send("Runtime.evaluate", { expression: `location.href = ${JSON.stringify(`http://${match}${path}`)}` });
} else {
  await send("Runtime.evaluate", { expression: "location.reload()" });
}
await new Promise((r) => setTimeout(r, 9000));
const result = await send("Runtime.evaluate", { expression, returnByValue: true });
console.log(JSON.stringify(JSON.parse(result.result.value), null, 2));
ws.close();
process.exit(0);
