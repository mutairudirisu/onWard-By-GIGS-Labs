// Scratch QA: full-page screenshot over CDP at an exact viewport width.
// Usage: node qa/shot.mjs <cdp-port> <width> <height> <url> <outfile> [clipY] [clipHeight]
const [
  port = "9223",
  width = "360",
  height = "740",
  url = "http://localhost:3002/",
  out = "qa/shot.png",
  clipY = "0",
  clipH = "0",
] = process.argv.slice(2);

const fs = await import("node:fs");

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
let page = list.find((t) => t.type === "page" && t.url === url);
if (!page) page = list.find((t) => t.type === "page" && t.url.startsWith("http://localhost"));
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
await new Promise((resolve) => (ws.onopen = resolve));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: Number(height),
  deviceScaleFactor: 1,
  mobile: Number(width) < 700,
});
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 10000));
const m = await send("Page.getLayoutMetrics");
const size = m.cssContentSize || m.contentSize;
const full = Number(clipH) || Math.min(Math.round(size.height) - Number(clipY), 15000);
const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: Number(clipY), scale: 1, width: Number(width), height: full },
});
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(out, "viewport:", width, "page height:", Math.round(size.height), "captured:", full);
ws.close();
process.exit(0);
