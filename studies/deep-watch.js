/* A Deep Watch commits one fitted tool and one crew to three successive sites.
   Only the leg entrance and the shore camp are checkpoints. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./sound-progression.js"));
  else root.SoundDeep = factory(root.SoundProgression);
})(typeof globalThis === "object" ? globalThis : this, function (progression) {
  "use strict";

  const MAX_DEPTH = 6;
  const SAVE_KEY = "alasia.deep-watch.v1";
  const LOCATIONS = { quay: "Gauge Steps", cut: "South Cut", sill: "Outer Sill" };
  const ROUTES = [
    ["quay", "cut", "sill"], ["cut", "sill", "quay"], ["sill", "quay", "cut"],
    ["quay", "sill", "cut"], ["sill", "cut", "quay"], ["cut", "quay", "sill"]
  ];
  const CONDITIONS = [
    ["surge", "armored"], ["haste", "surge"], ["armored", "haste"]
  ];
  const MODIFIERS = { surge: "Crosswash", armored: "Set plates", haste: "Short tide" };
  const fits = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;

  function mix(seed) {
    let value = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b);
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
    return (value ^ (value >>> 16)) >>> 0;
  }

  function isUnlocked(profile) {
    return !!profile && Array.isArray(profile.inventory) &&
      profile.inventory.some(item => item.id === "standing-watch" && item.rank === progression.MAX_TIER);
  }

  function create(profile) {
    return { version: 1, seed: profile.seed, record: 0, clears: Array(MAX_DEPTH).fill(0),
      launches: 0, active: null, lastResult: null, saveToken: null };
  }

  function itinerary(state, depth) {
    if (!fits(depth, 1, MAX_DEPTH)) return [];
    // Completing a depth rotates both the order and the condition pairs. A
    // failed launch advances neither, even if another depth is played first.
    const rotation = state.clears[depth - 1];
    const base = mix(state.seed ^ mix(depth));
    const sites = ROUTES[(base % ROUTES.length + rotation) % ROUTES.length];
    return sites.map((site, leg) => {
      const [modifier, secondaryModifier] = CONDITIONS[(base % 3 + rotation + leg) % 3];
      return { site, name: LOCATIONS[site], modifier, secondaryModifier,
        modifierText: MODIFIERS[modifier] + " + " + MODIFIERS[secondaryModifier],
        seed: mix(base ^ mix(rotation + 1) ^ mix(0x7340 + leg)) };
    });
  }

  function start(state, profile, depth) {
    if (!isUnlocked(profile) || state.seed !== profile.seed || profile.active || state.active ||
        !fits(depth, 1, Math.min(state.record + 1, MAX_DEPTH))) return state;
    return { ...state, launches: state.launches + 1, lastResult: null,
      active: { depth, leg: 0, phase: "fight", health: 1, choices: [], build: progression.getBuild(profile) } };
  }

  function ticket(state) {
    const run = state.active;
    return run && run.phase === "fight" ? [state.seed, state.launches, run.depth, run.leg].join("/") : null;
  }

  function encounter(state) {
    const run = state.active;
    if (!run || run.phase !== "fight") return null;
    const stop = itinerary(state, run.depth)[run.leg];
    const tunes = run.choices.filter(choice => choice === "tune").length;
    return { ...stop, tier: progression.MAX_TIER, watchDepth: run.depth,
      build: { ...run.build, power: run.build.power * (1 + 0.14 * tunes) },
      currentHealthRatio: run.health };
  }

  function retire(state) {
    const run = state.active;
    if (!run) return state;
    return { ...state, active: null, lastResult: { won: false, depth: run.depth, leg: run.leg } };
  }

  function resolve(state, receipt, won, hpRatio) {
    const run = state.active;
    if (!receipt || receipt !== ticket(state) || typeof won !== "boolean") return state;
    if (!won) return retire(state);
    if (!Number.isFinite(hpRatio) || hpRatio <= 0 || hpRatio > 1) return state;
    if (run.leg < 2) {
      return { ...state, active: { ...run, phase: "camp", health: Math.max(0.01, hpRatio) } };
    }
    const clears = [...state.clears];
    clears[run.depth - 1]++;
    return { ...state, active: null, clears, record: Math.max(state.record, run.depth),
      lastResult: { won: true, depth: run.depth, leg: run.leg } };
  }

  function choose(state, choice) {
    const run = state.active;
    if (!run || run.phase !== "camp" || !["repair", "tune"].includes(choice)) return state;
    const health = choice === "repair" ? Math.min(1, run.health + 0.4) : run.health;
    return { ...state, active: { ...run, phase: "fight", leg: run.leg + 1, health,
      choices: [...run.choices, choice] } };
  }

  function validBuild(build) {
    return build && progression.CLASS_IDS.includes(build.classId) &&
      (build.technique === undefined || progression.getTechniques({classId: build.classId, level: progression.MAX_LEVEL})
        .some(technique => technique.id === build.technique)) &&
      ["bearing", "followthrough", "quickstep"].includes(build.mastery) &&
      ["standard", "force", "reach", "flow"].includes(build.style) &&
      Number.isFinite(build.power) && build.power >= 1 && build.power <= 2 &&
      fits(build.maxHp, 80, 200) && Number.isFinite(build.recovery) && build.recovery >= 1 && build.recovery <= 1.3 &&
      typeof build.spill === "boolean" && (!build.spill || build.style === "reach");
  }

  function valid(state) {
    if (!state || state.version !== 1 || !fits(state.seed, 0, 0xffffffff) ||
        !fits(state.launches, 0, Number.MAX_SAFE_INTEGER) || !fits(state.record, 0, MAX_DEPTH) ||
        !Array.isArray(state.clears) || state.clears.length !== MAX_DEPTH ||
        !state.clears.every((count, index) => fits(count, index < state.record ? 1 : 0, index < state.record ? state.launches : 0))) return false;
    const finished = state.clears.reduce((a, b) => a + b, 0);
    if (finished + (state.active ? 1 : 0) > state.launches) return false;
    if (state.active !== null) {
      const run = state.active;
      if (!run || !validBuild(run.build) || !fits(run.depth, 1, Math.min(MAX_DEPTH, state.record + 1)) ||
          !fits(run.leg, 0, 2) || !["fight", "camp"].includes(run.phase) || (run.phase === "camp" && run.leg === 2) ||
          !Array.isArray(run.choices) || run.leg !== run.choices.length ||
          !run.choices.every(c => c === "tune" || c === "repair") ||
          !Number.isFinite(run.health) || run.health < 0.01 || run.health > 1 ||
          (run.phase === "fight" && run.leg === 0 && run.health !== 1)) return false;
    }
    if (state.lastResult !== null) {
      const result = state.lastResult;
      if (state.active || !result || typeof result.won !== "boolean" ||
          !fits(result.depth, 1, Math.min(MAX_DEPTH, state.record + 1)) || !fits(result.leg, 0, 2) ||
          !state.launches || (result.won && (result.leg !== 2 || !state.clears[result.depth - 1]))) return false;
    }
    return true;
  }

  function key(seed) { return SAVE_KEY + "." + seed; }

  function decode(raw, seed) {
    if (typeof raw !== "string" || raw.length > 4096) return null;
    const state = JSON.parse(raw);
    if (!valid(state) || state.seed !== seed || typeof state.saveToken !== "string" ||
        !state.saveToken.length || state.saveToken.length >= 100) return null;
    // Pre-technique routes always used the original profession actions.
    if (state.active && state.active.build.technique === undefined) state.active.build.technique = "standard";
    return state;
  }

  function load(storage, profile) {
    if (!isUnlocked(profile)) return null;
    try { return decode(storage.getItem(key(profile.seed)), profile.seed); }
    catch { return null; }
  }

  function save(storage, state) {
    try {
      if (!valid(state)) return false;
      const name = key(state.seed);
      const raw = storage.getItem(name);
      const prev = raw === null ? null : decode(raw, state.seed);
      if (raw !== null && !prev) return false;
      if ((prev ? prev.saveToken : null) !== state.saveToken) return false;
      const token = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      storage.setItem(name, JSON.stringify({ ...state, saveToken: token }));
      state.saveToken = token;
      return true;
    } catch { return false; }
  }

  return { MAX_DEPTH, SAVE_KEY, create, isUnlocked, itinerary, start, ticket, encounter, resolve, choose, retire, load, save };
});
