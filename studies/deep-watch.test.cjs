const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("./sound-progression.js");
const D = require("./deep-watch.js");
const C = require("./sound-combat.js");

function commission() {
  let profile = P.newProfile("sounder", 875);
  for (let grade = 1; grade <= P.MAX_TIER; grade++) {
    for (const call of P.getContracts(profile, grade).slice(0, grade === P.MAX_TIER ? 3 : 2)) {
      const current = P.getContracts(profile, grade).find(c => c.site === call.site);
      profile = P.finishRun(P.startRun(profile, current.id, grade), true);
    }
  }
  return profile;
}
function storage() {
  const data = new Map();
  return {data, getItem(key) { return data.get(key) ?? null; }, setItem(key, raw) { data.set(key, raw); }};
}
function land(state, health) { return D.resolve(state, D.ticket(state), true, health); }

test("entry requires a real three-site grade VI commission, and locks the chosen loadout", () => {
  const novice = P.newProfile("shorer", 875);
  const locked = D.create(novice);
  assert.equal(D.start(locked, novice, 1), locked);
  const p = commission();
  assert.ok(D.isUnlocked(p));
  const first = D.create(p);
  assert.equal(D.start(first, p, 2), first);
  assert.equal(D.start(first, {...p,active:{id:"field-call"}}, 1), first);
  const run = D.start(first, p, 1);
  assert.deepEqual(D.encounter(run).build, P.getBuild(p));
  const otherClass = P.setClass(p, "shorer");
  assert.notEqual(otherClass.classId, D.encounter(run).build.classId);
  assert.equal(D.start(run, otherClass, 1), run);
});

test("each route visits three different sites with three pairs; depth and kit reach the live combat model", () => {
  const p = commission();
  let state = D.create(p);
  for (let depth = 1; depth <= D.MAX_DEPTH; depth++) {
    const plan = D.itinerary(state, depth);
    assert.equal(new Set(plan.map(leg => leg.site)).size, 3);
    assert.equal(new Set(plan.map(leg => leg.modifierText)).size, 3);
    for (const leg of plan) assert.notEqual(leg.modifier, leg.secondaryModifier);
    state = D.start(state, p, depth);
    for (let i = 0; i < 3; i++) {
      const contract = D.encounter(state);
      assert.equal(contract.watchDepth, depth);
      assert.equal(contract.seed, plan[i].seed);
      assert.equal(contract.secondaryModifier, plan[i].secondaryModifier);
      const sim = C.createEncounter(contract);
      assert.equal(sim.site, contract.site);
      assert.equal(sim.watchDepth, depth);
      assert.equal(sim.secondaryModifier, contract.secondaryModifier);
      assert.ok(Math.abs(sim.player.hp/sim.player.maxHp - contract.currentHealthRatio) <= 1/sim.player.maxHp);
      state = land(state, 0.57);
      if (i < 2) state = D.choose(state, "tune");
    }
    assert.equal(state.record, depth);
    assert.equal(state.clears[depth-1], 1);
    assert.notDeepEqual(D.itinerary(state, depth).map(leg => leg.site), plan.map(leg => leg.site));
  }
  assert.equal(D.start(state, p, D.MAX_DEPTH + 1), state);
  assert.ok(D.start(state, p, D.MAX_DEPTH).active);
});

test("camp offers exclusive persistent repairs or cumulative output; callbacks resolve only the current leg", () => {
  const p = commission();
  const first = D.start(D.create(p), p, 1);
  const id = D.ticket(first);
  for (const hp of [0, NaN, 1.1,-1]) assert.equal(D.resolve(first,id,true,hp), first);
  const camp = land(first,0.44);
  assert.equal(D.encounter(camp), null);
  assert.equal(D.resolve(camp,id,true,1), camp);
  assert.equal(D.choose(camp, "both"), camp);
  const repaired = D.choose(camp, "repair");
  assert.ok(Math.abs(D.encounter(repaired).currentHealthRatio - 0.84) < 1e-8);
  assert.equal(D.encounter(repaired).build.power, first.active.build.power);
  assert.equal(D.resolve(repaired,id,false,0), repaired);
  const tuned = D.choose(camp, "tune");
  assert.equal(D.encounter(tuned).currentHealthRatio, 0.44);
  const twice = D.choose(land(tuned,0.3), "tune");
  assert.equal(D.encounter(twice).build.power, first.active.build.power*1.28);
  assert.equal(D.choose(twice, "repair"), twice);
});

test("defeat or withdrawal keeps the same route and old tickets cannot finish a retry", () => {
  const p = commission();
  const first = D.start(D.create(p), p, 1);
  const camp = land(first,0.8);
  const legTwo = D.choose(camp,"tune");
  for (const ended of [D.retire(camp),D.resolve(legTwo,D.ticket(legTwo),false,0)]) {
    assert.equal(ended.record,0);
    assert.equal(ended.lastResult.won,false);
    const restarted = D.start(ended,p,1);
    assert.notEqual(D.ticket(restarted),D.ticket(first));
    assert.deepEqual(D.encounter(restarted),D.encounter(first));
    assert.equal(D.resolve(restarted,D.ticket(first),true,1),restarted);
  }
});

test("reload keeps the camp, chosen build and seeded entrance; stale or malformed saves cannot overwrite it", () => {
  const p = commission(), locker = storage();
  const first = D.start(D.create(p),p,1);
  assert.ok(D.save(locker,first));
  const otherTab = D.load(locker,p);
  const camp = land(first,0.54);
  assert.ok(D.save(locker,camp));
  assert.equal(D.save(locker,D.retire(otherTab)), false);
  assert.deepEqual(D.load(locker,p),camp);
  const repaired = D.choose(D.load(locker,p),"repair");
  assert.ok(D.save(locker,repaired));
  assert.deepEqual(D.encounter(D.load(locker,p)),D.encounter(repaired));
  // Seed changes identify different characters. The record stays in this locker.
  assert.equal(D.load(locker,{...p,seed:p.seed+1}),null);
  assert.equal(D.load(locker,P.newProfile("shorer",p.seed)),null);
  const [[key,original]] = locker.data;
  const bad = JSON.parse(original);
  bad.active.health = -4;
  for (const raw of ["{", JSON.stringify(bad), JSON.stringify({...camp, version:2})]) {
    locker.setItem(key,raw);
    assert.equal(D.load(locker,p),null);
    assert.equal(D.save(locker,D.create(p)),false);
    assert.equal(locker.getItem(key),raw);
  }
  assert.equal(D.save({getItem(){return null;},setItem(){throw new Error("quota");}},first),false);
});
