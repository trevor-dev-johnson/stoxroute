const [url = "http://localhost:3002", widthInput = "390", heightInput = "844", port = "9223"] = process.argv.slice(2);
const width = Number(widthInput);
const height = Number(heightInput);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = tabs.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
if (!page) throw new Error("No debuggable Chrome page was found");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let nextId = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const handler = message.id ? pending.get(message.id) : undefined;
  if (handler) {
    pending.delete(message.id);
    handler(message);
  }
};
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await call("Runtime.evaluate", { expression, returnByValue: true });
  return response.result.value;
}

await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 720 });
await call("Page.navigate", { url });
for (let attempt = 0; attempt < 80; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.compare-button'))")) break;
  await wait(250);
}
if (!await evaluate("Boolean(document.querySelector('.compare-button'))")) {
  throw new Error("The scan control did not become available");
}
await evaluate("document.querySelector('.compare-button')?.click()");
for (let attempt = 0; attempt < 120; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.board-summary'))")) break;
  await wait(500);
}
if (!await evaluate("Boolean(document.querySelector('.board-summary'))")) {
  throw new Error("The opportunity scan did not complete");
}

const report = await evaluate(`JSON.stringify({
  viewport: { width: innerWidth, height: innerHeight },
  document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  heading: document.querySelector('h1')?.innerText,
  boardHeading: document.querySelector('.board-head h2')?.innerText,
  rows: [...document.querySelectorAll('.opportunity-row')].map((row) => row.innerText.replace(/\\n+/g, ' · ')),
  boardSummary: document.querySelector('.board-summary')?.innerText,
  restrictionsVisible: Boolean(document.querySelector('.risk-note')),
  executionState: document.querySelector('.execution-state')?.innerText,
  executionAction: document.querySelector('.execution__action')?.innerText,
  amountHeight: document.querySelector('.amount-field')?.getBoundingClientRect().height,
  scanButtonHeight: document.querySelector('.compare-button')?.getBoundingClientRect().height,
  minimumPresetHeight: Math.min(...[...document.querySelectorAll('.preset-row button')].map((button) => button.getBoundingClientRect().height)),
})`);
console.log(report);
socket.close();
