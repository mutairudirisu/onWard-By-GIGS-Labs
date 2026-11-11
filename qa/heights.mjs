// Scratch QA: report page heights for a set of urls at a set of widths.
// Usage: node qa/heights.mjs <cdp-port> <widths csv> <paths csv>
const [port = "9223", widthsArg = "360,1440", pathsArg = "/,/pricing"] = process.argv.slice(2);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page");
if (!page) {
  console.log("NO PAGE");
  process.exit(1);
}
async function probe(width, path) {
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
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 800,
    deviceScaleFactor: 1,
    mobile: width < 700,
  });
  await send("Page.navigate", { url: `http://localhost:3002${path}` });
  await new Promise((r) => setTimeout(r, 9000));
  const m = await send("Page.getLayoutMetrics");
  const h = Math.round((m.cssContentSize || m.contentSize).height);
  ws.close();
  return h;
}
for (const w of widthsArg.split(",").map(Number)) {
  for (const p of pathsArg.split(",")) {
    console.log(w, p, await probe(Number(w), p));
  }
}
