// Scratch QA: what is actually on screen at an exact width (url, headings, scroll).
const [port = "9223", width = "360", path = "/notes"] = process.argv.slice(2);
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: 740,
  deviceScaleFactor: 1,
  mobile: Number(width) < 700,
});
await send("Page.navigate", { url: `http://localhost:3001${path}` });
await new Promise((r) => setTimeout(r, 12000));
const r = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `JSON.stringify({
    url: location.pathname,
    text: document.body.innerText.replace(/\\s+/g, " ").slice(0, 220),
    docScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  })`,
});
console.log(r.result.value);
ws.close();
process.exit(0);
