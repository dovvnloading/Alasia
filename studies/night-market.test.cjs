const { test } = require("node:test");
const assert = require("node:assert/strict");
const bell = require("./pay-bell.js");
const pigs = require("./pig-door.js");

function play(model, state, ...ids) {
  for (const id of ids) assert.equal(model.act(state, id), true, id);
}

test("a living fitter, his stamp and the price of collection", () => {
  for (const hire of [false, true]) {
    for (const ending of ["sell", "extract", "scrap"]) {
      const s = bell.start();
      play(bell, s, "old");
      if (hire) play(bell, s, "rent");
      play(bell, s, "descend");
      if (hire) play(bell, s, "clamp");
      else {
        play(bell, s, "step");
        assert.equal(s.room, "wheel");
        play(bell, s, "step");
      }
      play(bell, s, "inspect", ending === "scrap" ? "spoil" : "whole", ending);
      const price = ending === "sell" ? 6 : 2;
      assert.equal(s.price, price);
      assert.equal(s.coins, price + (hire ? 0 : 1));
      assert.equal(bell.act(s, ending), false);
      play(bell, s, "return");
      if (ending !== "sell") assert.equal(bell.act(s, "bar"), false);
      const item = ending === "sell" ? "bar" : "shoe";
      play(bell, s, item, "try", "use");
      assert.equal(s.purchase, item);
      assert.equal(s.tried, true);
      assert.equal(bell.act(s, "use"), false);
      play(bell, s, "again");
      assert.deepEqual(s, bell.start());
    }
  }
});

test("the sale at Reedward changes wages, strap prices and who pays freight", () => {
  const direct = pigs.start();
  assert.equal(pigs.act(direct, "direct"), false);
  play(pigs, direct, "turn", "mill", "book", "direct", "return", "work");
  assert.equal(pigs.act(direct, "strap"), false);
  play(pigs, direct, "work", "strap", "quay", "carry", "release", "quay", "carry");
  assert.equal(direct.delivered, 2);
  const covered = pigs.start();
  play(pigs, covered, "covered", "return", "quay", "freight");
  assert.equal(covered.credit, 0);
  assert.equal(covered.delivered, 2);
  const unpaid = pigs.start();
  play(pigs, unpaid, "pass", "return", "quay");
  assert.equal(pigs.act(unpaid, "freight"), false);
  play(pigs, unpaid, "carry", "shelter", "quay", "recover", "quay", "carry");
  assert.equal(unpaid.delivered, 2);
});
