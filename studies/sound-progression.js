/* The watch board, fitting bench and single-player locker. Actions return a new
   profile. The contract on a saved profile is the ticket for that same run. */
(() => {
  'use strict';

  const SAVE_KEY = 'alasia.sound-watch.v1';
  const CLASS_IDS = ['shorer', 'sounder', 'linewright'];
  const SITES = ['quay', 'cut', 'sill'];
  const STAMPS = ['strike', 'tempo', 'ward'];
  const GRADES = ['Slack water', 'First rise', 'Running tide', 'Spring tide', 'Storm reach', 'High water'];
  const LEVEL_XP = [0, 35, 95, 165, 255, 360, 480, 625, 800, 1000];
  const MAX_TIER = GRADES.length;
  const MAX_LEVEL = LEVEL_XP.length;
  const MAX_FIELD_PIECES = 3;
  const STARTER = 'dock-issue';
  const COMMISSION = 'standing-watch';
  const sites = {
    quay: { name: 'Gauge Steps', district: 'Orren', style: 'reach',
      description: 'The ferry is standing off the ramp. Clear the shelf so the pilot can put her board down.',
      provenance: 'The Orren riggers fit a long socket to a foreplate recovered beside the ramp.' },
    cut: { name: 'South Cut', district: 'Orren', style: 'force',
      description: 'The shore watch has unloaded the donor shunt. Open its fouled return before the next working stroke.',
      provenance: 'The shunt crew mills a sprung collar from the spare transfer shoes in its store.' },
    sill: { name: 'Outer Sill', district: 'Selwick', style: 'flow',
      description: 'A service crew needs the bridge. Cross the guide bed and relieve its sticking return.',
      provenance: 'A Selwick fitter cuts the service bridge’s worn runner down to a sliding heel.' }
  };
  const styles = {
    reach: { name: 'Long Socket', effect: 'Primary reach +35%. Primary damage −15%.' },
    force: { name: 'Transfer Collar', effect: 'Spender damage +40%. Spender resource cost +25%.' },
    flow: { name: 'Sliding Heel', effect: 'Dodge recharges 30% sooner. Maximum health −15%.' }
  };
  const stampNames = { strike: 'Striker', tempo: 'Quick-set', ward: 'Braced' };
  const modifiers = {
    calm: { name: 'Clear footing', description: 'The bed is quiet between working strokes.' },
    surge: { name: 'Crosswash', description: 'A marked lane erupts about every six seconds. Step clear of its seams.' },
    armored: { name: 'Set plates', description: 'Enemies resist frontal damage outside recovery. Flank or catch them turning.' },
    haste: { name: 'Short tide', description: 'Moving enemies travel 25% faster. Their attack tells keep their usual timing.' }
  };
  const masteries = [
    { id: 'bearing', name: 'Bearing', level: 1, description: 'Gain 16 maximum health.' },
    { id: 'followthrough', name: 'Follow-through', level: 2, description: 'A primary hit during enemy recovery earns 8 extra resource. Sounders add the reading to that target.' },
    { id: 'quickstep', name: 'Quickstep', level: 4, description: 'Each spender takes half a second off the remaining dodge cooldown.' }
  ];

  const techniques = {
    shorer: [
      { id: 'standard', name: 'Broad Heel', level: 1, description: 'Return Stroke drives one broad fan straight ahead. Brace edges carry the release through enemies along their length.' },
      { id: 'split-heel', name: 'Split Heel', level: 3, description: 'Return Stroke sends two longer, narrow wedges 35° to either side. Aim between two packs. The centre stays open unless a brace edge crosses it.' }
    ],
    sounder: [
      { id: 'standard', name: 'Long Reading', level: 1, description: 'Readings last six seconds. True Return spends a reading to deliver its full force to one target.' },
      { id: 'narrow-mouth', name: 'Narrow Mouth', level: 3, description: 'True Return can pass through to a second aligned target. Each target needs its own reading and takes 80% of the normal strike. Readings expire in four seconds.' }
    ],
    linewright: [
      { id: 'standard', name: 'Open Splice', level: 1, description: 'Work a long cable between hook and peg. Snap Cast catches enemies in a close band along the cable.' },
      { id: 'hard-splice', name: 'Hard Splice', level: 3, description: 'Snap Cast catches enemies across a band almost twice as wide. Working cable length falls to about three quarters. Set your pegs closer together.' }
    ]
  };

  function bounded(value, min, max) {
    return Number.isSafeInteger(value) && value >= min && value <= max;
  }

  function seedValue() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 4294967296);
  }

  // Deterministic avalanche so neighboring runs do not place matching packs or stamps.
  function mix(value) {
    value ^= value >>> 16;
    value = Math.imul(value, 0x21f0aaad);
    value ^= value >>> 15;
    value = Math.imul(value, 0x735a2d97);
    return (value ^ (value >>> 15)) >>> 0;
  }

  function levelFor(xp) {
    return LEVEL_XP.filter(threshold => xp >= threshold).length;
  }

  function getLevelProgress(profile) {
    if (profile.level === MAX_LEVEL) return { current: 0, needed: 0 };
    const floor = LEVEL_XP[profile.level - 1];
    return { current: profile.xp - floor, needed: LEVEL_XP[profile.level] - floor };
  }

  function getMasteries(profile) {
    return masteries.map(m => ({ ...m, unlocked: profile.level >= m.level }));
  }

  function getTechniques(profile) {
    return techniques[profile.classId].map(t => ({ ...t, unlocked: profile.level >= t.level }));
  }

  function setTechnique(profile, id) {
    const classId = profile.classId;
    if (profile.active || profile.techniques[classId] === id || !getTechniques(profile).some(t => t.id === id && t.unlocked)) return profile;
    return { ...profile, techniques: { ...profile.techniques, [classId]: id } };
  }

  function baseItem() {
    return { id: STARTER, name: 'Dock Issue', rank: 0, style: 'standard', stamp: 'plain', stampName: 'Plain',
      gradeName: 'Workshop issue', description: 'Standard reach, return and dodge. Your original fitting is always in the locker.' };
  }

  function watchItem() {
    return { id: COMMISSION, name: 'Standing Watch Collar', rank: MAX_TIER, style: 'standard', stamp: 'commission',
      stampName: 'Commissioned', gradeName: 'Three-site watch',
      description: 'Primary attacks cycle 15% faster. Gain 16 maximum health. The three benches stamped this collar together after your high-water watch.' };
  }

  function makeItem(site, stamp, rank) {
    const style = sites[site].style;
    const stampBonus = stamp === 'ward' ? `+${4 + rank * 3} maximum health.`
      : stamp === 'tempo' ? `+${4 + rank * 3}% primary attack speed.` : `+${3 + rank * 2}% damage.`;
    const spill = style === 'reach' && rank >= 4 ? ' A primary hit transfers 40% damage to one additional unstruck foe nearby.' : '';
    return { id: `${site}-${stamp}`, site, style, stamp, rank, stampName: stampNames[stamp],
      name: `${stampNames[stamp]} ${styles[style].name}`, gradeName: GRADES[rank - 1],
      description: `${styles[style].effect}${spill} ${stampBonus}`, provenance: sites[site].provenance };
  }

  function getBuild(profile, candidate) {
    const id = typeof candidate === 'string' ? candidate : profile.equipped;
    const item = candidate && typeof candidate === 'object' ? candidate : profile.inventory.find(i => i.id === id) || baseItem();
    let power = 1 + (profile.level - 1) * 0.045;
    let maxHp = 100 + (profile.level - 1) * 4 + (profile.mastery === 'bearing' ? 16 : 0);
    let recovery = 1;
    if (item.stamp === 'strike') power *= 1 + (3 + item.rank * 2) / 100;
    if (item.stamp === 'tempo') recovery += (4 + item.rank * 3) / 100;
    if (item.stamp === 'ward') maxHp += 4 + item.rank * 3;
    if (item.id === COMMISSION) { recovery += 0.15; maxHp += 16; }
    if (item.style === 'flow') maxHp *= 0.85;
    return { classId: profile.classId, mastery: profile.mastery, technique: profile.techniques?.[profile.classId] || 'standard', power, maxHp: Math.round(maxHp), recovery,
      style: item.style, spill: item.style === 'reach' && item.rank >= 4 };
  }

  function newProfile(classId = 'shorer', seed = seedValue()) {
    const record = {}, bests = {};
    for (let grade = 1; grade <= MAX_TIER; grade++) {
      record[grade] = { quay: 0, cut: 0, sill: 0 };
      bests[grade] = { quay: null, cut: null, sill: null };
    }
    return { version: 1, saveToken: null, seed: seed >>> 0, classId: CLASS_IDS.includes(classId) ? classId : 'shorer',
      xp: 0, level: 1, salvage: 0, tier: 1, clears: 0, record, bests, inventory: [baseItem()], equipped: STARTER,
      mastery: 'bearing', techniques: Object.fromEntries(CLASS_IDS.map(id => [id, 'standard'])), active: null, lastResult: null };
  }

  function getGradeProgress(profile, tier = profile.tier) {
    const row = profile.record[tier];
    const sitesCleared = row ? SITES.filter(site => row[site] > 0).length : 0;
    const topGrade = tier === MAX_TIER;
    const required = topGrade ? SITES.length : 2;
    return { sitesCleared, required, topGrade, complete: sitesCleared >= required };
  }

  function getContracts(profile, tier = profile.tier) {
    if (!bounded(tier, 1, profile.tier)) return [];
    return SITES.map((site, index) => {
      const place = sites[site];
      const seed = mix(profile.seed ^ mix(profile.clears + 1) ^ mix(7 * tier + index));
      const rough = ['surge', 'armored', 'haste'];
      const firstQuay = tier === 1 && site === 'quay' && profile.record[1].quay === 0;
      const rotation = (mix(profile.seed) % rough.length + profile.clears + tier - 1) % rough.length;
      const modifier = firstQuay ? 'calm' : rough[(rotation + index) % rough.length];
      const clearCount = profile.record[tier][site];
      return { id: `${site}-${tier}-${seed}`, seed, tier, site, modifier, name: place.name, siteName: place.name,
        district: place.district, gradeName: GRADES[tier - 1], modifierName: modifiers[modifier].name,
        modifierDescription: modifiers[modifier].description, description: place.description, clearCount, cleared: clearCount > 0,
        bestSeconds: profile.bests[tier][site],
        rewardHint: `Grade ${tier} ${styles[place.style].name} · ${styles[place.style].effect}${place.style === 'reach' && tier >= 4 ? ' Adds a second nearby hit.' : ''}` };
    });
  }

  function startRun(profile, contractId, tier = profile.tier) {
    if (profile.active) return profile;
    const contract = getContracts(profile, tier).find(c => c.id === contractId);
    return contract ? { ...profile, active: contract, lastResult: null } : profile;
  }

  function putItem(inventory, item) {
    const existing = inventory.find(piece => piece.id === item.id);
    if (!existing) return [...inventory, item];
    if (existing.rank >= item.rank) return inventory;
    return inventory.map(piece => piece.id === item.id ? item : piece);
  }

  function partValue(tier) { return tier >= 4 ? 3 : 2; }

  function receiptMessage(result) {
    if (!result.won) return 'The crew brought you back. Your locker is intact. The same call is still on the board.';
    let text = result.item
      ? `${sites[result.site].provenance} Your locker now holds the ${result.item.name}.`
      : 'The bench already holds an equal or better stamp. Its parts went into salvage.';
    if (result.fieldPieces) {
      const parts = result.fieldPieces === 1 ? 'part' : 'parts';
      text += ` The quartermaster paid ${result.fieldSalvage} salvage for ${result.fieldPieces} recovered ${parts}.`;
    }
    if (result.openedTier) text += ` The crews opened grade ${result.openedTier}, ${GRADES[result.openedTier - 1]}.`;
    if (result.commission) text += ' All three crews have signed your high-water watch. Their Standing Watch Collar is in your locker.';
    return text;
  }

  function finishRun(profile, won, metrics = {}) {
    if (!profile.active || typeof won !== 'boolean') return profile;
    const { site, tier, seed } = profile.active;
    const result = { won, site, tier, previousLevel: profile.level, xp: 0, salvage: 0, fieldPieces: 0, fieldSalvage: 0, item: null, commission: null,
      seconds: null, previousBestSeconds: profile.bests[tier][site], bestSeconds: profile.bests[tier][site],
      firstRecord: false, newPersonalBest: false, openedTier: null };
    if (!won) return { ...profile, active: null, lastResult: { ...result, message: receiptMessage(result) } };
    const stamp = STAMPS[mix(seed ^ 0x6512a903) % STAMPS.length];
    const drop = makeItem(site, stamp, tier);
    let inventory = putItem(profile.inventory, drop);
    const duplicate = inventory === profile.inventory;
    const record = { ...profile.record, [tier]: { ...profile.record[tier], [site]: profile.record[tier][site] + 1 } };
    const xp = Math.min(LEVEL_XP[MAX_LEVEL - 1] - profile.xp, 36 + 12 * tier + (profile.active.modifier === 'calm' ? 0 : 8));
    const collected = metrics && metrics.salvageCollected;
    result.fieldPieces = bounded(collected, 0, MAX_FIELD_PIECES) ? collected : 0;
    result.fieldSalvage = result.fieldPieces * partValue(tier);
    const salvage = 4 + 2 * tier + (duplicate ? 4 + tier : 0) + result.fieldSalvage;
    let bests = profile.bests;
    const seconds = metrics && metrics.seconds;
    if (validTime(seconds)) {
      result.seconds = Math.max(0.01, Math.round(seconds * 100) / 100);
      result.firstRecord = result.previousBestSeconds === null;
      result.newPersonalBest = !result.firstRecord && result.seconds < result.previousBestSeconds;
      if (result.firstRecord || result.newPersonalBest) {
        result.bestSeconds = result.seconds;
        bests = { ...bests, [tier]: { ...bests[tier], [site]: result.seconds } };
      }
    }
    const next = { ...profile, active: null, record, bests, clears: profile.clears + 1, xp: profile.xp + xp,
      level: levelFor(profile.xp + xp), salvage: profile.salvage + salvage };
    if (tier === profile.tier && getGradeProgress(next, tier).complete) {
      if (tier < MAX_TIER) {
        next.tier++;
        result.openedTier = next.tier;
      } else if (!inventory.some(i => i.id === COMMISSION)) {
        result.commission = watchItem();
        inventory = putItem(inventory, result.commission);
      }
    }
    result.xp = xp;
    result.salvage = salvage;
    result.item = duplicate ? null : drop;
    return { ...next, inventory, lastResult: { ...result, message: receiptMessage(result) } };
  }

  function equip(profile, itemId) {
    if (profile.active || profile.equipped === itemId || !profile.inventory.some(i => i.id === itemId)) return profile;
    return { ...profile, equipped: itemId };
  }

  function setMastery(profile, id) {
    if (profile.active || profile.mastery === id || !getMasteries(profile).some(m => m.id === id && m.unlocked)) return profile;
    return { ...profile, mastery: id };
  }

  function setClass(profile, classId) {
    if (profile.active || profile.classId === classId || !CLASS_IDS.includes(classId)) return profile;
    return { ...profile, classId };
  }

  function getRecipes(profile) {
    return SITES.flatMap(site => {
      let grade = profile.tier;
      while (grade > 0 && !profile.record[grade][site]) grade--;
      return STAMPS.map(stamp => {
        const item = makeItem(site, stamp, Math.max(grade, 1));
        const existing = profile.inventory.find(i => i.id === item.id);
        const owned = Boolean(existing && existing.rank >= item.rank);
        const cost = 8 + item.rank * 3;
        return { id: item.id, name: item.name, description: item.description, item, cost, owned,
          unlocked: grade > 0, affordable: profile.salvage >= cost, siteName: sites[site].name };
      });
    });
  }

  function craft(profile, recipeId) {
    if (profile.active) return profile;
    const recipe = getRecipes(profile).find(r => r.id === recipeId);
    if (!recipe || !recipe.unlocked || !recipe.affordable || recipe.owned) return profile;
    return { ...profile, salvage: profile.salvage - recipe.cost, inventory: putItem(profile.inventory, recipe.item) };
  }

  // Keep the serialized format independent of side-panel copy and balance
  // values. Reconstruct contracts/items from their stable identifiers on load.
  function pack(profile, token) {
    return { version: 1, token, seed: profile.seed, classId: profile.classId, xp: profile.xp,
      salvage: profile.salvage, record: profile.record, bests: profile.bests, mastery: profile.mastery, techniques: profile.techniques, equipped: profile.equipped,
      pieces: profile.inventory.map(i => [i.id, i.rank]),
      ticket: profile.active && [profile.active.id, profile.active.tier],
      receipt: profile.lastResult && { won: profile.lastResult.won, site: profile.lastResult.site, tier: profile.lastResult.tier,
        previousLevel: profile.lastResult.previousLevel, xp: profile.lastResult.xp, salvage: profile.lastResult.salvage,
        fieldPieces: profile.lastResult.fieldPieces,
        item: profile.lastResult.item && profile.lastResult.item.id, commission: !!profile.lastResult.commission,
        openedTier: profile.lastResult.openedTier, seconds: profile.lastResult.seconds, previousBestSeconds: profile.lastResult.previousBestSeconds } };
  }

  function readItem(id, rank, profile) {
    if (id === STARTER && rank === 0) return baseItem();
    if (id === COMMISSION && rank === MAX_TIER && getGradeProgress(profile, MAX_TIER).complete) return watchItem();
    if (typeof id !== 'string' || !bounded(rank, 1, MAX_TIER)) return null;
    const [site, stamp] = id.split('-');
    if (!SITES.includes(site) || !STAMPS.includes(stamp) || id !== `${site}-${stamp}` || !profile.record[rank][site]) return null;
    return makeItem(site, stamp, rank);
  }

  function validTime(value) {
    return Number.isFinite(value) && value > 0 && value <= 604800;
  }

  function restore(data) {
    if (!data || data.version !== 1 || !bounded(data.seed, 0, 0xffffffff) || !CLASS_IDS.includes(data.classId) ||
        !bounded(data.xp, 0, LEVEL_XP[MAX_LEVEL - 1]) || !bounded(data.salvage, 0, Number.MAX_SAFE_INTEGER) ||
        typeof data.token !== 'string' || !data.token || data.token.length > 120 || !data.record ||
        !Array.isArray(data.pieces) || data.pieces.length > 11) return null;
    const p = newProfile(data.classId, data.seed);
    p.saveToken = data.token;
    p.xp = data.xp;
    p.level = levelFor(p.xp);
    p.salvage = data.salvage;
    if (data.techniques !== undefined) {
      if (!data.techniques || typeof data.techniques !== 'object' || Array.isArray(data.techniques)) return null;
      for (const classId of CLASS_IDS) {
        const id = data.techniques[classId];
        if (!techniques[classId].some(t => t.id === id && t.level <= p.level)) return null;
        p.techniques[classId] = id;
      }
    }
    for (let grade = 1; grade <= MAX_TIER; grade++) {
      const row = data.record[grade];
      if (!row || !SITES.every(s => bounded(row[s], 0, 100000000))) return null;
      for (const site of SITES) {
        if (row[site] && p.tier < grade) return null;
        p.record[grade][site] = row[site];
        p.clears += row[site];
      }
      if (p.tier === grade && grade < MAX_TIER && getGradeProgress(p, grade).complete) p.tier++;
    }
    if (data.bests != null) {
      for (let grade = 1; grade <= MAX_TIER; grade++) {
        const row = data.bests[grade];
        if (!row) return null;
        for (const site of SITES) {
          const time = row[site];
          if (time !== null && (!p.record[grade][site] || !validTime(time))) return null;
          p.bests[grade][site] = time;
        }
      }
    }
    p.inventory = [];
    for (const entry of data.pieces) {
      if (!Array.isArray(entry) || entry.length !== 2) return null;
      const item = readItem(entry[0], entry[1], p);
      if (!item || p.inventory.some(i => i.id === item.id)) return null;
      p.inventory.push(item);
    }
    if (!p.inventory.some(i => i.id === STARTER) || !p.inventory.some(i => i.id === data.equipped)) return null;
    if (!getMasteries(p).some(m => m.id === data.mastery && m.unlocked)) return null;
    p.equipped = data.equipped;
    p.mastery = data.mastery;
    if (data.ticket != null) {
      if (!Array.isArray(data.ticket)) return null;
      const [id, tier] = data.ticket;
      p.active = getContracts(p, tier).find(c => c.id === id) || null;
      if (!p.active) return null;
    }
    if (!p.active && data.receipt) {
      const r = data.receipt;
      if (typeof r.won !== 'boolean' || !SITES.includes(r.site) || !bounded(r.tier, 1, p.tier) ||
          !bounded(r.previousLevel, 1, p.level) || !bounded(r.xp, 0, 200) || !bounded(r.salvage, 0, 60)) return null;
      const fieldPieces = r.fieldPieces === undefined ? 0 : r.fieldPieces;
      if (!bounded(fieldPieces, 0, r.won ? MAX_FIELD_PIECES : 0) || r.salvage < fieldPieces * partValue(r.tier)) return null;
      const item = r.item ? readItem(r.item, r.tier, p) : null;
      if (r.item && (!item || !p.inventory.some(i => i.id === item.id))) return null;
      const commission = r.commission && p.inventory.find(i => i.id === COMMISSION) || null;
      const openedTier = r.openedTier || null;
      if (openedTier !== null && (!r.won || openedTier !== r.tier + 1 || openedTier > p.tier)) return null;
      const seconds = validTime(r.seconds) ? r.seconds : null;
      const previousBestSeconds = validTime(r.previousBestSeconds) ? r.previousBestSeconds : null;
      p.lastResult = { seconds, previousBestSeconds, bestSeconds: p.bests[r.tier][r.site],
        firstRecord: seconds !== null && previousBestSeconds === null,
        newPersonalBest: seconds !== null && previousBestSeconds !== null && seconds < previousBestSeconds,
        won: r.won, site: r.site, tier: r.tier, previousLevel: r.previousLevel,
        xp: r.xp, salvage: r.salvage, fieldPieces, fieldSalvage: fieldPieces * partValue(r.tier), item, commission, openedTier };
      p.lastResult.message = receiptMessage(p.lastResult);
    }
    return p;
  }

  function load(storage) {
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (!raw || raw.length > 65536) return null;
      return restore(JSON.parse(raw));
    } catch { return null; }
  }

  function save(storage, profile) {
    try {
      const raw = storage.getItem(SAVE_KEY);
      let previous = null;
      if (raw !== null) {
        // An older or damaged record must never be replaced just because the
        // browser failed to restore it. Leave it available for recovery.
        if (raw.length > 65536) return false;
        previous = JSON.parse(raw);
        if (!restore(previous)) return false;
      }
      if ((previous ? previous.token : null) !== profile.saveToken) return false;
      const token = `${Date.now().toString(36)}-${seedValue().toString(36)}-${seedValue().toString(36)}`;
      storage.setItem(SAVE_KEY, JSON.stringify(pack(profile, token)));
      profile.saveToken = token;
      return true;
    } catch { return false; }
  }

  const api = { SAVE_KEY, CLASS_IDS, GRADES, MAX_TIER, MAX_LEVEL, MAX_FIELD_PIECES, newProfile, getLevelProgress, getMasteries,
    getBuild, getContracts, getGradeProgress, startRun, finishRun, equip, setMastery, getTechniques, setTechnique, setClass, getRecipes, craft, save, load };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SoundProgression = api;
})();
