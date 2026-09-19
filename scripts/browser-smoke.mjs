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
const consoleErrors = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    consoleErrors.push(message.params.args.map((argument) => argument.value ?? argument.description ?? "Unknown console error").join(" "));
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text);
  }
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

await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 720 });
await call("Page.navigate", { url });
for (let attempt = 0; attempt < 80; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.compare-button'))")) break;
  await wait(250);
}
if (!await evaluate("Boolean(document.querySelector('.compare-button'))")) {
  throw new Error("The comparison control did not become available");
}
await evaluate("document.querySelector('.featured-market')?.click()");
if (await evaluate("Boolean(document.querySelector('.compare-button')?.disabled)")) {
  throw new Error("Selecting a featured market did not enable comparison");
}
await evaluate("document.querySelector('.compare-button')?.click()");
for (let attempt = 0; attempt < 120; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.results, .notice'))")) break;
  await wait(500);
}
if (!await evaluate("Boolean(document.querySelector('.results'))")) {
  throw new Error(`The selected-market comparison did not complete: ${await evaluate("document.querySelector('.notice')?.innerText ?? 'No error message' ")}`);
}
await evaluate("document.querySelector('.scan-all-action')?.click()");
for (let attempt = 0; attempt < 120; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.board-summary'))")) break;
  await wait(500);
}
if (!await evaluate("Boolean(document.querySelector('.board-summary'))")) throw new Error("The optional opportunity scan did not complete");

const report = await evaluate(`JSON.stringify({
  viewport: { width: innerWidth, height: innerHeight },
  document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  heading: document.querySelector('h1')?.innerText,
  selectedMarket: document.querySelector('.asset-line strong')?.innerText,
  comparisonHeading: document.querySelector('.results__head h2')?.innerText,
  boardHeading: document.querySelector('.board-head h2')?.innerText,
  rows: [...document.querySelectorAll('.opportunity-row')].map((row) => row.innerText.replace(/\\n+/g, ' · ')),
  boardSummary: document.querySelector('.board-summary')?.innerText,
  restrictionsVisible: Boolean(document.querySelector('.risk-note')),
  executionState: document.querySelector('.execution-state')?.innerText,
  executionAction: document.querySelector('.execution__action')?.innerText,
  amountHeight: document.querySelector('.amount-field')?.getBoundingClientRect().height,
  scanButtonHeight: document.querySelector('.compare-button')?.getBoundingClientRect().height,
  minimumPresetHeight: Math.min(...[...document.querySelectorAll('.preset-row button')].map((button) => button.getBoundingClientRect().height)),
  consoleErrors: ${JSON.stringify(consoleErrors)},
})`);
console.log(report);
socket.close();
