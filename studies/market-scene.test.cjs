const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const window = {};
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
      if (id === "restart") continue;
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
