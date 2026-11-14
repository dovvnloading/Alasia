const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./sound-progression.js');

function run(p, site, won = true, tier = p.tier) {
  const offer = P.getContracts(p, tier).find(c => c.site === site);
  return P.finishRun(P.startRun(p, offer.id, tier), won);
}

function memory() {
  const map = new Map();
  return {
    getItem: k => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => map.set(k, v)
  };
}

test('the bench offers three targeted routes and a gentle first quay on a reproducible board', () => {
  const a = P.newProfile('linewright', 350), b = P.newProfile('sounder', 350);
  assert.deepEqual(P.getContracts(a), P.getContracts(b));
  assert.equal(new Set(P.getContracts(a).map(c => c.seed)).size, 3);
  assert.equal(P.getContracts(a)[0].modifier, 'calm');
  assert.deepEqual(P.getContracts(a, 2), []);
  for (const sector of ['quay', 'cut', 'sill']) {
    const result = run(a, sector);
    assert.equal(result.lastResult.item.site, sector);
    assert.match(P.getContracts(a).find(c => c.site === sector).rewardHint, new RegExp(result.lastResult.item.name.split(' ').slice(1).join(' ')));
    assert.equal(result.record[1][sector], 1);
    assert.equal(result.lastResult.previousLevel, 1);
    assert.equal(result.level, 2);
    assert.notDeepEqual(P.getContracts(a), P.getContracts(result));
  }
  assert.deepEqual(a, P.newProfile('linewright', 350));
});

test('defeat retries the identical encounter and a committed ticket pays once', () => {
  const p = P.newProfile('shorer', 7);
  const [offer] = P.getContracts(p);
  const active = P.startRun(p, offer.id);
  const failed = P.finishRun(active, false);
  assert.deepEqual(P.getContracts(failed)[0], offer);
  for (const key of ['clears', 'inventory', 'level', 'salvage', 'record', 'mastery']) assert.deepEqual(failed[key], p[key]);
  const result = run(failed, 'quay');
  assert.equal(P.finishRun(result, true), result);
  assert.equal(P.startRun(result, offer.id), result);
  assert.equal(P.startRun(p, 'nonexistent'), p);
  assert.equal(P.finishRun(active, 'won'), active);
  assert.equal(P.startRun(active, offer.id), active);
});

test('locked board changes and earned mastery choices survive switching profession', () => {
  let p = P.newProfile('shorer', 2);
  assert.equal(P.setMastery(p, 'followthrough'), p);
  p = run(p, 'sill');
  const piece = p.lastResult.item;
  const candidate = P.getBuild(p, piece);
  p = P.equip(p, piece.id);
  assert.deepEqual(P.getBuild(p), candidate);
  p = P.setMastery(p, 'followthrough');
  assert.equal(P.getBuild(p).mastery, 'followthrough');
  assert.equal(P.setMastery(p, 'quickstep'), p);
  const swapped = P.setClass(p, 'sounder');
  assert.equal(P.getBuild(swapped).classId, 'sounder');
  assert.equal(swapped.inventory, p.inventory);
  assert.equal(swapped.xp, p.xp);
  const active = P.startRun(p, P.getContracts(p)[0].id);
  for (const [action, arg] of [[P.equip, 'dock-issue'], [P.setClass, 'linewright'], [P.setMastery, 'bearing'], [P.craft, 'sill-tempo']]) {
    assert.equal(action(active, arg), active);
  }
});

test('two different sites unlock a grade even when the first was farmed; lower grades remain available', () => {
  let p = P.newProfile('sounder', 81);
  for (let i = 0; i < 4; i++) p = run(p, 'cut');
  assert.equal(p.tier, 1);
  assert.equal(P.getGradeProgress(p).sitesCleared, 1);
  p = run(p, 'sill');
  assert.equal(p.tier, 2);
  assert.deepEqual(P.getGradeProgress(p, 1), { sitesCleared: 2, required: 2, complete: true, topGrade: false });
  const tier2 = P.getContracts(p, 2)[0];
  assert.equal(P.startRun(p, tier2.id, 1), p);
  p = run(p, 'quay', true, 1);
  assert.equal(p.tier, 2);
  assert.equal(p.record[1].quay, 1);
  assert.equal(p.record[2].quay, 0);
});

test('all stamp descriptions match equipped stat changes and crafting is deterministic and never downgrades', () => {
  let p = P.newProfile('shorer', 5);
  assert.equal(P.craft(p, 'quay-ward'), p);
  for (let i = 0; i < 12; i++) p = run(p, 'quay');
  for (const r of P.getRecipes(p)) {
    if (r.item.site !== 'quay') { assert.equal(r.unlocked, false); continue; }
    const before = P.getBuild(p, 'dock-issue');
    const preview = P.getBuild(p, r.item);
    const made = P.craft(p, r.id);
    assert.equal(made.salvage, p.salvage - (r.owned ? 0 : r.cost));
    assert.deepEqual(preview, P.getBuild(P.equip(made, r.id)));
    assert.equal(P.craft(made, r.id), made);
    assert.equal(preview.spill, false);
    if (r.item.stamp === 'tempo') assert.equal(preview.recovery, 1.07);
    if (r.item.stamp === 'ward') assert.equal(preview.maxHp - before.maxHp, 7);
    if (r.item.stamp === 'strike') assert.equal(preview.power, before.power * 1.05);
    p = made;
  }
  const noCash = { ...p, salvage: 0, inventory: p.inventory.slice(0, 1) };
  assert.equal(P.craft(noCash, 'quay-ward'), noCash);
});

test('high-workmanship pickup upgrades equipped matching stamp in place and adds a crowd-chaining build', () => {
  let p = P.newProfile('shorer', 62);
  p = run(p, 'quay');
  p = P.equip(p, p.lastResult.item.id);
  const id = p.equipped;
  for (let i = 0; i < 3; i++) { p = run(p, 'quay'); p = run(p, 'cut'); }
  assert.equal(p.tier, 4);
  p = run(p, 'quay');
  p = P.craft(p, id);
  assert.equal(P.getBuild(p).spill, true);
  assert.equal(p.inventory.filter(i => i.id === id).length, 1);
  const rank = p.inventory.find(i => i.id === id).rank;
  for (let i = 0; i < 10; i++) p = run(p, 'quay', true, 1);
  assert.equal(p.inventory.find(i => i.id === id).rank, rank);
  assert.ok(p.lastResult.salvage > 6);
});

test('all three high-water jobs grant the one-off collar, and completed careers can still play', () => {
  let p = P.newProfile('linewright', 241);
  for (let grade = 1; grade < P.MAX_TIER; grade++) { p = run(p, 'quay'); p = run(p, 'cut'); }
  for (const site of ['quay', 'cut']) p = run(p, site);
  assert.equal(p.lastResult.commission, null);
  p = run(p, 'sill');
  const collar = p.lastResult.commission;
  assert.ok(collar);
  assert.equal(P.getGradeProgress(p).complete, true);
  const before = P.getBuild(p, 'dock-issue'), after = P.getBuild(p, collar);
  assert.equal(after.maxHp - before.maxHp, 16);
  assert.equal(after.recovery, 1.15);
  for (let i = 0; i < 10; i++) p = run(p, 'sill');
  assert.equal(p.level, P.MAX_LEVEL);
  assert.equal(p.lastResult.xp, 0);
  assert.equal(p.tier, P.MAX_TIER);
  assert.equal(p.lastResult.commission, null);
  assert.ok(p.inventory.length <= 11);
  assert.deepEqual(P.getLevelProgress(p), { current: 0, needed: 0 });
});

test('saves restore the same ticket and reward, reject stale updates and tolerate unavailable storage', () => {
  const store = memory();
  const p = P.newProfile('sounder', 0);
  assert.equal(P.load(store), null);
  assert.ok(P.save(store, p));
  const oldTab = P.load(store);
  const active = P.startRun(p, P.getContracts(p)[1].id);
  assert.ok(P.save(store, active));
  assert.deepEqual(P.load(store).active, active.active);
  assert.equal(P.save(store, P.setClass(oldTab, 'shorer')), false);
  const result = P.finishRun(P.load(store), true);
  assert.deepEqual(result.lastResult, P.finishRun(active, true).lastResult);
  assert.ok(P.save(store, result));
  assert.equal(P.save(store, P.finishRun(active, true)), false);
  const reloaded = P.load(store);
  assert.equal(reloaded.active, null);
  assert.deepEqual(reloaded.lastResult, result.lastResult);
  assert.equal(P.finishRun(reloaded, true), reloaded);
  assert.equal(P.save(null, p), false);
  assert.equal(P.load(null), null);
});

test('truncated, unsupported and malformed saves do not enter gameplay or get overwritten', () => {
  const store = memory();
  const p = P.newProfile('sounder', 0);
  assert.ok(P.save(store, p));
  const stored = JSON.parse(store.getItem(P.SAVE_KEY));
  const corrupt = [null, {}, { ...stored, version: 2 }, { ...stored, equipped: 'missing' },
    { ...stored, ticket: ['anything', 1] }, { ...stored, record: { ...stored.record, 6: { cut: 3, quay: 0, sill: 0 } } },
    { ...stored, pieces: [...stored.pieces, ['quay-strike', 1]] }, { ...stored, pieces: [null] }];
  for (const data of corrupt) {
    const serialized = JSON.stringify(data);
    store.setItem(P.SAVE_KEY, serialized);
    assert.equal(P.load(store), null);
    assert.equal(P.save(store, P.newProfile()), false);
    assert.equal(store.getItem(P.SAVE_KEY), serialized);
  }
  store.setItem(P.SAVE_KEY, '{');
  assert.equal(P.load(store), null);
  assert.equal(P.save(store, P.newProfile()), false);
});

test('timed victories set site and grade records; failure, a slower clear, and bad timing data preserve them', () => {
  let p = P.newProfile('shorer', 31);
  function attempt(won, seconds, site = 'quay', tier = p.tier) {
    const c = P.getContracts(p, tier).find(offer => offer.site === site);
    p = P.finishRun(P.startRun(p, c.id, tier), won, { seconds });
    return p.lastResult;
  }
  assert.equal(attempt(true, 63.416).seconds, 63.42);
  assert.equal(p.lastResult.firstRecord, true);
  assert.equal(p.lastResult.newPersonalBest, false);
  assert.equal(attempt(false, 3).bestSeconds, 63.42);
  assert.equal(attempt(true, 75).newPersonalBest, false);
  const improved = attempt(true, 60.2);
  assert.equal(improved.previousBestSeconds, 63.42);
  assert.equal(improved.bestSeconds, 60.2);
  assert.equal(improved.firstRecord, false);
  assert.equal(improved.newPersonalBest, true);
  const store = memory();
  assert.ok(P.save(store, p));
  const loaded = P.load(store);
  assert.equal(loaded.lastResult.newPersonalBest, true);
  assert.equal(P.getContracts(loaded).find(c => c.site === 'quay').bestSeconds, 60.2);
  assert.equal(P.getContracts(loaded).find(c => c.site === 'cut').bestSeconds, null);
  assert.equal(attempt(true, 15, 'cut').firstRecord, true);
  assert.equal(p.tier, 2);
  for (const time of [0, -1, NaN, Infinity, undefined, '42']) {
    assert.equal(attempt(true, time).bestSeconds, null);
  }
  assert.equal(P.getContracts(p, 1)[0].bestSeconds, 60.2);
  const priorSave = JSON.parse(store.getItem(P.SAVE_KEY));
  delete priorSave.bests;
  delete priorSave.receipt.seconds;
  delete priorSave.receipt.previousBestSeconds;
  store.setItem(P.SAVE_KEY, JSON.stringify(priorSave));
  assert.equal(P.getContracts(P.load(store))[0].bestSeconds, null);
});

test('the quartermaster pays for recovered ground parts once, on successful return, at the cleared grade', () => {
  const p = P.newProfile('shorer', 812);
  const active = P.startRun(p, P.getContracts(p)[0].id);
  const noParts = P.finishRun(active, true);
  const paid = P.finishRun(active, true, { salvageCollected: 3 });
  assert.equal(paid.lastResult.fieldPieces, 3);
  assert.equal(paid.lastResult.fieldSalvage, 6);
  assert.equal(paid.salvage, noParts.salvage + 6);
  assert.equal(paid.lastResult.salvage, noParts.lastResult.salvage + 6);
  assert.match(paid.lastResult.message, /paid 6 salvage for 3 recovered parts/);
  assert.equal(P.finishRun(paid, true, { salvageCollected: 3 }), paid);
  for (const count of [4, -1, 1.4, '3', NaN]) {
    assert.equal(P.finishRun(active, true, { salvageCollected: count }).salvage, noParts.salvage);
  }
  assert.equal(P.finishRun(active, false, { salvageCollected: 3 }).salvage, p.salvage);
  const store = memory();
  assert.ok(P.save(store, paid));
  assert.deepEqual(P.load(store).lastResult, paid.lastResult);
  const legacy = JSON.parse(store.getItem(P.SAVE_KEY));
  delete legacy.receipt.fieldPieces;
  store.setItem(P.SAVE_KEY, JSON.stringify(legacy));
  assert.equal(P.load(store).lastResult.fieldSalvage, 0);
  let high = p;
  for (let i = 0; i < 3; i++) { high = run(high, 'cut'); high = run(high, 'sill'); }
  const ticket = P.startRun(high, P.getContracts(high)[1].id);
  const rich = P.finishRun(ticket, true, { salvageCollected: 2 });
  assert.equal(rich.lastResult.fieldSalvage, 6);
});
