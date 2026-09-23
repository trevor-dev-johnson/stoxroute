import { writeFile } from "node:fs/promises";

const [url = "http://localhost:3002", widthInput = "390", heightInput = "844", port = "9223", screenshotPath] = process.argv.slice(2);
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
await wait(400);
if (await evaluate("Boolean(document.querySelector('.wallet-adapter-button, .execution-state, .execution__action'))")) {
  throw new Error("Public transaction controls are still visible");
}
if (!await evaluate("document.body.innerText.includes('Trading execution is not currently available.')")) {
  throw new Error("The restrained footer disclosure is missing");
}
await evaluate("[...document.querySelectorAll('.popular-tickers button')].find((button) => button.textContent?.trim() === 'AAPL')?.click()");
if (await evaluate("Boolean(document.querySelector('.compare-button')?.disabled)")) {
  throw new Error("Selecting a popular market did not enable comparison");
}
await evaluate(`(() => {
  window.__stoxrouteQuoteRequestCount = 0;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    if (String(args[0]).includes('/api/quotes')) window.__stoxrouteQuoteRequestCount += 1;
    return originalFetch(...args);
  };
  const input = document.querySelector('#amount');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, '1e3');
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await evaluate("document.querySelector('.compare-button')?.click()");
await wait(150);
if (!await evaluate("document.querySelector('#amount')?.value === '1e3'")) {
  throw new Error("Scientific notation was transformed instead of preserved for validation");
}
if (!await evaluate("document.querySelector('#amount-error')?.innerText.includes('plain USDC amount')")) {
  throw new Error("Scientific notation did not produce the visible budget validation error");
}
if (await evaluate("window.__stoxrouteQuoteRequestCount !== 0")) {
  throw new Error("Scientific notation reached the quote endpoint");
}
await evaluate(`(() => {
  const input = document.querySelector('#amount');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, '1,000');
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await evaluate("document.querySelector('.compare-button')?.click()");
for (let attempt = 0; attempt < 120; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.results, .notice'))")) break;
  await wait(500);
}
if (!await evaluate("Boolean(document.querySelector('.results'))")) {
  throw new Error(`The selected-market comparison did not complete: ${await evaluate("document.querySelector('.notice')?.innerText ?? 'No error message' ")}`);
}
if (!await evaluate("[...document.querySelectorAll('summary')].some((summary) => summary.innerText.includes('View details'))")) {
  throw new Error("The non-transactional route-details action is missing");
}
if (!await evaluate("Boolean(document.querySelector('.answer-panel h2')) && document.querySelector('.answer-panel').offsetTop < document.querySelector('.routes').offsetTop")) {
  throw new Error("The answer does not lead the route details");
}
if (screenshotPath) {
  await wait(350);
  await evaluate("document.querySelector('.answer-panel')?.scrollIntoView({ block: 'start' })");
  await wait(150);
  const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
}
await evaluate("document.querySelector('.scan-all-action')?.click()");
for (let attempt = 0; attempt < 240; attempt += 1) {
  if (await evaluate("Boolean(document.querySelector('.board-summary'))")) break;
  await wait(500);
}
if (!await evaluate("Boolean(document.querySelector('.board-summary'))")) throw new Error("The optional opportunity scan did not complete");
const opportunityRowCount = await evaluate("document.querySelectorAll('.opportunity-row').length");
if (opportunityRowCount !== 9) throw new Error(`Expected 9 opportunity rows, found ${opportunityRowCount}`);

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
  answer: document.querySelector('.answer-panel h2')?.innerText,
  difference: document.querySelector('.answer-panel__difference')?.innerText,
  routeDetailsActions: [...document.querySelectorAll('summary')].filter((summary) => summary.innerText.includes('View details')).length,
  publicTransactionControls: document.querySelectorAll('.wallet-adapter-button, .execution-state, .execution__action').length,
  executionDisclosure: document.body.innerText.includes('Trading execution is not currently available.'),
  amountHeight: document.querySelector('.amount-field')?.getBoundingClientRect().height,
  scanButtonHeight: document.querySelector('.compare-button')?.getBoundingClientRect().height,
  minimumTickerChipHeight: Math.min(...[...document.querySelectorAll('.popular-tickers button')].map((button) => button.getBoundingClientRect().height)),
  consoleErrors: ${JSON.stringify(consoleErrors)},
})`);
console.log(report);
socket.close();
