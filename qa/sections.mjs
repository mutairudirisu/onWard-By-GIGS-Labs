// Scratch QA: per-section geometry at an exact viewport width.
// Usage: node qa/sections.mjs <cdp-port> <width> <path>
const [port = "9223", width = "1440", path = "/"] = process.argv.slice(2);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: 900,
  deviceScaleFactor: 1,
  mobile: Number(width) < 700,
});
await send("Page.navigate", { url: `http://localhost:3002${path}` });
await new Promise((r) => setTimeout(r, 9000));

const expression = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const secs = document.querySelectorAll("main > section, main > div > section");
  for (const s of secs) {
    const r = s.getBoundingClientRect();
    const top = Math.round(r.top + window.scrollY);
    const h = Math.round(r.height);
    // widest descendant block that carries content
    let inner = 0, innerTag = "";
    for (const c of s.querySelectorAll("div,ul,ol,p,h1,h2")) {
      const cr = c.getBoundingClientRect();
      if (cr.width > inner && cr.height > 8) { inner = Math.round(cr.width); innerTag = c.tagName + "." + String(c.className).split(" ").slice(0,2).join("."); }
    }
    const cs = getComputedStyle(s);
    out.push({ id: s.id || "-", top, h, bg: cs.backgroundColor, inner, fill: Math.round((inner / vw) * 100) });
  }
  const navH = Math.round(document.querySelector("header")?.getBoundingClientRect().height || 0);
  return JSON.stringify({ vw, navH, sections: out });
})()`;

const res = await send("Runtime.evaluate", { expression, returnByValue: true });
const data = JSON.parse(res.result.value);
console.log(`viewport ${data.vw} · nav ${data.navH}`);
for (const s of data.sections) {
  console.log(
    String(s.top).padStart(6),
    `h=${String(s.h).padStart(5)}`,
    `fill=${String(s.fill).padStart(3)}%`,
    `inner=${String(s.inner).padStart(5)}`,
    `#${s.id}`,
  );
}
ws.close();
process.exit(0);
