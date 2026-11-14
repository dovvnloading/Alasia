const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const window = {};
runInNewContext(readFileSync(join(__dirname, "odd-shoe.js"), "utf8"), { window });
runInNewContext(readFileSync(join(__dirname, "market-scene.js"), "utf8"), { window });
const { start, act, choices } = window.MarketSteps;

function doWork(state, ...actions) {
  for (const id of actions) assert.equal(act(state, id), true, id);
}

function waitForPulse(state, pulse) {
  for (let i = 0; i < 3 && state.pulse !== pulse; i++) doWork(state, "wait");
  assert.equal(state.pulse, pulse);
}

function stateKey(state) {
  const { text, ...facts } = state;
  return JSON.stringify(facts);
}

test("every reachable state can finish the crossing without a restart", () => {
  const pending = [start()];
  const predecessors = new Map([[stateKey(pending[0]), []]]);
  const finished = [];
  for (const state of pending) {
    const from = stateKey(state);
    if (state.phase === "done") finished.push(from);
    for (const { id } of choices(state)) {
      if (id === "restart" || id === "visitShop") continue;
      const next = structuredClone(state);
      doWork(next, id);
      const to = stateKey(next);
      if (!predecessors.has(to)) {
        predecessors.set(to, []);
        pending.push(next);
      }
      predecessors.get(to).push(from);
    }
  }
  // Walk backwards from every ending. A looping pocket can have legal moves
  // and still strand the player forever.
  const canFinish = new Set(finished);
  for (const to of canFinish) {
    for (const from of predecessors.get(to)) canFinish.add(from);
  }
  for (const key of predecessors.keys()) assert.ok(canFinish.has(key), key);
});

test("the high mooring buys the handline and loses its landing on the return", () => {
  const high = start();
  doWork(high, "go1", "moorSill");
  assert.equal(high.secured, true);
  assert.equal(high.position, 2);
  assert.equal(high.ada, high.position);
  assert.equal(act(high, "take"), false);
  doWork(high, "go4");
  assert.equal(act(high, "take"), false, "the brass must be documented in place");
  doWork(high, "go5", "rub", "go4", "take", "go2");
  assert.equal(act(high, "leave"), false);
  assert.equal(act(high, "go1"), false, "the upper ledge has fallen");
  doWork(high, "go4");
  waitForPulse(high, 0);
  doWork(high, "go3", "go1", "leave");
  assert.equal(high.phase, "verran");
});

test("the low mooring needs a way across for Ada and preserves its berth", () => {
  const low = start();
  doWork(low, "go1", "moorGutter", "go3");
  assert.equal(low.ada, 1);
  assert.equal(act(low, "lookGutter"), false);
  assert.equal(act(low, "go4"), false);
  waitForPulse(low, 2);
  doWork(low, "go1");
  assert.equal(low.position, 3, "a raised crown forces the worker back");
  doWork(low, "unseat", "guide", "lookGutter", "go4", "go5", "rub", "go4", "take", "go3", "leave");
  assert.equal(low.phase, "verran");
  doWork(low, "slip1", "slip2");
  assert.equal(low.receipt, false);
  assert.equal(act(low, "order1"), false);
  doWork(low, "slip0", "order2");
  assert.equal(low.phase, "verran");
  doWork(low, "order1");
  assert.equal(low.phase, "relief");
  for (const [action, witnessed] of [["spell", true], ["pass", false]]) {
    const ending = structuredClone(low);
    doWork(ending, action);
    assert.equal(ending.phase, "done");
    assert.equal(ending.witnessed, witnessed);
    doWork(ending, "restart");
    assert.equal(stateKey(ending), stateKey(start()));
  }
});

test("the chart draws the skiff at the pilot's actual berth", () => {
  const translations = [];
  const context = onScreen => {
    const ctx = {};
    for (const name of [
      "beginPath", "moveTo", "lineTo", "closePath", "stroke", "fill", "ellipse", "fillRect",
      "fillText", "save", "restore", "rotate", "scale", "setTransform", "drawImage", "clip", "arc"
    ]) ctx[name] = () => {};
    ctx.translate = (x, y) => { if (onScreen) translations.push([x, y]); };
    ctx.createLinearGradient = () => ({ addColorStop() {} });
    ctx.measureText = str => ({ width: str.length * 6 });
    return ctx;
  };
  const document = { createElement: () => ({ width: 0, height: 0, getContext: () => context(false) }) };
  class Path2DStub { moveTo() {} lineTo() {} bezierCurveTo() {} }
  runInNewContext(readFileSync(join(__dirname, "market-chart.js"), "utf8"), {
    window, document, Path2D: Path2DStub
  });
  const canvas = { width: 0, height: 0, getContext: () => context(true) };
  const high = start();
  doWork(high, "go1", "moorSill", "go4", "go5", "rub", "go4", "take");
  assert.equal(high.phase, "return");
  window.drawMarketChart(canvas, high);
  assert.ok(translations.some(([x, y]) => x === 254 && y === 259),
    "recalled high-berth skiff must be at the broken rail");
  assert.ok(!translations.some(([x, y]) => x === 120 && y === 320),
    "skiff must not remain at the initial approach");
  translations.length = 0;
  const low = start();
  doWork(low, "go1", "moorGutter");
  window.drawMarketChart(canvas, low);
  assert.ok(translations.some(([x, y]) => x === 465 && y === 351),
    "low-berth skiff must stay in the gutter");
  assert.deepEqual([canvas.width, canvas.height], [1600, 880]);
});

test("Nell pays one fitting fee, and a visit survives a walk round the stair", () => {
  const state = window.MarketSteps.startAtShop();
  assert.equal(act(state, "heel"), false);
  doWork(state, "fit", "cut");
  assert.equal(state.shop.fit, "open");
  doWork(state, "square", "outside", "counter", "cord");
  assert.equal(act(state, "heel"), false);
  assert.equal(act(state, "fit"), false);
  doWork(state, "ruth", "stocking", "buttons", "witness", "window", "outside", "counter");
  assert.equal(state.shop.order, "window");
  assert.equal(state.shop.purchase, "cord");
  assert.equal(act(state, "stairs"), false);
  doWork(state, "outside", "restart");
  assert.equal(stateKey(state), stateKey(start()));
});

test("either household entry can lead to the shop, and Ruth needs no purchase", () => {
  for (const ending of ["spell", "pass"]) {
    const state = start();
    doWork(state, "go1", "moorGutter", "go3");
    waitForPulse(state, 0);
    doWork(state, "unseat", "guide", "go4", "go5", "rub", "go4", "take", "go3", "leave",
      "slip0", "order1", ending, "visitShop", "ruth", "buttons", "stairs");
    assert.equal(state.witnessed, ending === "spell");
    assert.equal(state.shop.fit, "open");
    assert.equal(state.shop.order, "stairs");
    doWork(state, "fit", "square", "heel");
    assert.equal(act(state, "cord"), false);
  }
});
