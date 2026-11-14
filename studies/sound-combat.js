/* The Inner Sound field trial. Game coordinates and durations are in pixels and seconds. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SoundCombat = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const WIDTH = 960,
    HEIGHT = 540,
    WORK_REACH = 60;
  const BANK = {
    left: 45,
    right: 915,
    top: 56,
    bottom: 491
  };
  const CLASSES = {
    shorer: {
      primary: "Heel Strike",
      tool: "Set Foot",
      skill: "Return Stroke",
      resource: "Counterload",
      reach: 85,
      rate: 0.32,
      damage: 16
    },
    sounder: {
      primary: "Plumb Cast",
      tool: "Take Sounding",
      skill: "True Return",
      resource: "Reading",
      reach: 245,
      rate: 0.38,
      damage: 14
    },
    linewright: {
      primary: "Lead Throw",
      tool: "Tie Off",
      skill: "Snap Cast",
      resource: "Tension",
      reach: 194,
      rate: 0.32,
      damage: 13
    }
  };
  const ALTERNATE_TECHNIQUE = {
    shorer: "split-heel", sounder: "narrow-mouth", linewright: "hard-splice"
  };
  const FOES = {
    scout: {
      name: "Bridleshell scout",
      hp: 35,
      speed: 90,
      radius: 12,
      reach: 152,
      damage: 12
    },
    mason: {
      name: "Bridleshell Mason",
      hp: 87,
      speed: 61,
      radius: 21,
      reach: 172,
      damage: 19
    },
    chalk: {
      name: "Chalk fissure",
      hp: 36,
      speed: 48,
      radius: 12,
      reach: 170,
      damage: 13
    },
    crown: {
      name: "Chalk Crown",
      hp: 58,
      speed: 31,
      radius: 18,
      reach: 245,
      damage: 16
    },
    matron: {
      name: "Breakwater Mason",
      hp: 418,
      speed: 78,
      radius: 31,
      reach: 196,
      damage: 24
    },
    shunt: {
      name: "South Cut donor shunt",
      hp: 390,
      speed: 0,
      radius: 34,
      reach: 720,
      damage: 24
    },
    jack: {
      name: "Outer Sill return guide",
      hp: 410,
      speed: 0,
      radius: 36,
      reach: 720,
      damage: 24
    }
  };
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const point = (x, y) => ({ x, y });

  function bounded(body, radius) {
    body.x = clamp(body.x, BANK.left + radius, BANK.right - radius);
    body.y = clamp(body.y, BANK.top + radius, BANK.bottom - radius);
  }

  function seedNumber(seed) {
    let n = 2166136261;
    for (const ch of String(seed)) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return n >>> 0;
  }

  function random(s) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }

  function segmentDistance(p, a, b) {
    const x = b.x - a.x,
      y = b.y - a.y;
    const t = clamp(((p.x - a.x) * x + (p.y - a.y) * y) / (x * x + y * y || 1), 0, 1);
    return Math.hypot(p.x - a.x - t * x, p.y - a.y - t * y);
  }

  function intersects(shape, body, radius = 8) {
    if (shape.type === "line") {
      const {x, y, length, angle, width} = shape;
      const end = point(x + length * Math.cos(angle), y + length * Math.sin(angle));
      return segmentDistance(body, shape, end) <= width / 2 + radius;
    }
    const d = dist(shape, body);
    return d <= shape.radius + radius && (shape.type !== "ring" || d >= shape.inner - radius);
  }

  function addEffect(s, type, data, ttl) {
    s.effects.push({
      type,
      ttl,
      life: ttl,
      ...data
    });
    if (s.effects.length > 72) s.effects.shift();
  }

  function sound(s, type) {
    s.audioCues.push({
      id: ++s.audioId,
      type
    });
    if (s.audioCues.length > 12) s.audioCues.shift();
  }

  function cue(s, text) {
    s.cue = text;
    s.cueTime = 1.35;
  }

  function createEncounter({
    seed = 1,
    tier = 1,
    site = "quay",
    modifier = "calm",
    secondaryModifier = null,
    build = {},
    workOrder = null,
    currentHealthRatio = 1,
    watchDepth = 0
  } = {}) {
    const classId = Object.hasOwn(CLASSES, build.classId) ? build.classId : "shorer";
    const style = ["reach", "force", "flow"].includes(build.style) ? build.style : "standard";
    const maxHp = Math.max(1, Number(build.maxHp) || 100);
    const depth = clamp(Math.floor(watchDepth) || 0, 0, 6);
    const s = {
      seed,
      rng: seedNumber(seed),
      site: ["quay", "cut", "sill"].includes(site) ? site : "quay",
      modifier,
      secondaryModifier,
      watchDepth: depth,
      deepDamage: 1 + 0.10 * Math.max(0, depth - 1),
      modifiers: [...new Set([modifier, secondaryModifier].filter(m => ["surge", "haste", "armored"].includes(m)))],
      tier: clamp(Math.floor(Number(tier) || 1), 1, 6),
      classId,
      style,
      technique: build.technique === ALTERNATE_TECHNIQUE[classId] ? build.technique : "standard",
      power: clamp(Number(build.power) || 1, 0.2, 10),
      recovery: clamp(Number(build.recovery) || 1, 0.4, 6),
      status: "active",
      elapsed: 0,
      wave: 0,
      waveCount: 3,
      waveTime: 0,
      kills: 0,
      waveKills: 0,
      pickups: [],
      salvageCollected: 0,
      nextId: 1,
      workOrder: workOrder && Number.isFinite(workOrder.x) && Number.isFinite(workOrder.y) ? {
        ...workOrder,
        x: clamp(workOrder.x, BANK.left + 10, BANK.right - 10),
        y: clamp(workOrder.y, BANK.top + 10, BANK.bottom - 10),
        done: false
      } : null,
      mastery: build.mastery,
      spill: Boolean(build.spill) && style === "reach",
      audioId: 0,
      audioCues: [],
      objective: "",
      lastHitCause: "",
      cue: "",
      cueTime: 0,
      enemies: [],
      effects: [],
      stakes: [],
      nodes: [],
      hazards: [],
      hazardTimer: 5,
      player: {
        x: 380,
        y: 270,
        angle: 0,
        hp: Math.max(1, Math.round(maxHp * clamp(Number(currentHealthRatio) || 0.01, 0.01, 1))),
        maxHp,
        resource: 0,
        maxResource: classId === "sounder" ? 60 : 100,
        skillCost: style === "force" ? 35 : 28,
        attackCooldown: 0,
        toolCooldown: 0,
        skillCooldown: 0,
        dodgeCooldown: 0,
        dash: 0,
        dashAngle: 0,
        invulnerable: 0,
        hit: 0,
        swing: 0
      },
      previous: {},
      buffer: {
        skill: 0,
        tool: 0,
        dodge: 0
      }
    };
    spawnWave(s);
    return s;
  }

  function spawnFoe(s, kind, x, y, boss = false) {
    const data = FOES[kind],
      tierStep = s.tier - 1;
    const maxHp = Math.round(data.hp * (1 + tierStep * 0.16));
    const e = {
      id: s.nextId++,
      kind,
      name: data.name,
      boss,
      x,
      y,
      angle: angleTo({ x, y }, s.player),
      hp: maxHp,
      maxHp,
      radius: data.radius,
      speed: data.speed * (s.modifiers.includes("haste") ? 1.25 : 1),
      reach: data.reach,
      damage: data.damage * (1 + tierStep * 0.12) * s.deepDamage,
      mode: "approach",
      timer: 0.4 + random(s) * 0.4,
      patterns: 0,
      shapes: [],
      action: "",
      hit: 0,
      reading: 0,
      readTime: 0,
      opened: false,
      phase: 1
    };
    bounded(e, e.radius);
    s.enemies.push(e);
  }

  function spawnWave(s) {
    s.wave++;
    s.waveKills = 0;
    s.waveTime = 0;
    const sides = [
      [720, 235],
      [610, 398],
      [628, 130],
      [238, 109],
      [196, 377],
      [807, 349]
    ];
    const first = s.wave === 1 ? Math.floor(random(s) * 3) : Math.floor(random(s) * sides.length);
    const turn = random(s) < 0.5 ? 1 : -1;
    let roster;
    s.reinforcement = null;
    if (s.wave === 3) {
      sound(s, "boss");
      const boss = {
        quay: "matron",
        cut: "shunt",
        sill: "jack"
      }[s.site];
      const loc = s.site === "quay" ? sides[first] : [635, 265];
      spawnFoe(s, boss, loc[0], loc[1], true);
      roster = s.tier >= 3 ? [s.site === "quay" ? "scout" : "chalk"] : [];
      s.objective = {
        quay: "Turn the Breakwater Mason",
        cut: "Vent the donor shunt",
        sill: "Free the return guide"
      }[s.site];
    } else {
      const pick = list => list[Math.floor(random(s) * list.length)];
      if (s.wave === 1) {
        roster = {
          quay: ["scout", "scout", "mason"],
          cut: ["chalk", "scout", "chalk"],
          sill: ["crown", "chalk", "scout"]
        }[s.site];
      } else {
        if (s.site === "quay") roster = ["mason", "scout", pick(["scout", "mason"]), "scout"];
        if (s.site === "cut") roster = ["crown", "mason", pick(["chalk", "scout"]), "chalk"];
        if (s.site === "sill") roster = ["crown", "scout", pick(["chalk", "crown"]), "mason"];
      }
      if (s.wave === 2) {
        // A second group pushes in from the open bank once the first formation breaks.
        const relief = {
          quay: ["scout", "mason", "scout"],
          cut: ["chalk", "crown", "scout"],
          sill: ["chalk", "crown", "mason"]
        }[s.site];
        if (s.tier >= 4) relief.push(s.site === "quay" ? "mason" : "crown");
        const bearing = sides[(first + 3) % sides.length];
        s.reinforcement = {
          roster: relief,
          x: bearing[0],
          y: bearing[1],
          timer: null
        };
      }
      if (s.tier >= 4) roster.push(pick(s.site === "quay" ? ["scout", "mason"] : ["scout", "chalk"]));
      s.objective = {
        quay: ["Clear the mudcut", "Open the upper landing"],
        cut: ["Open the intake", "Break the chalk seam"],
        sill: ["Clear the approach", "Reach the guide bed"]
      }[s.site][s.wave - 1];
    }
    roster.forEach((kind, i) => {
      const base = sides[(first + turn * i + sides.length * 2) % sides.length];
      let x = base[0] + (random(s) - 0.5) * 62,
        y = base[1] + (random(s) - 0.5) * 54;
      if (dist({ x, y }, s.player) < 115) {
        x = WIDTH - x;
        y = HEIGHT - y;
      }
      spawnFoe(s, kind, x, y);
    });
  }

  function gain(s, value) {
    if (s.classId !== "sounder") s.player.resource = Math.min(s.player.maxResource, s.player.resource + value);
  }

  function read(s, e, value) {
    e.reading = Math.min(60, e.reading + value);
    e.readTime = s.technique === "narrow-mouth" ? 4 : 6;
  }

  function updateReadings(s) {
    if (s.classId === "sounder") s.player.resource = Math.max(0, ...s.enemies.filter(e => e.hp > 0).map(e => e.reading));
  }

  function hit(s, e, amount, impulse = 0) {
    if (e.hp <= 0) return;
    const facing = angleDiff(e.angle, angleTo(e, s.player)) < 0.86;
    const plated = ["mason", "matron"].includes(e.kind) || s.modifiers.includes("armored");
    // A loaded machine shelters the return fitting. During its vent all classes get a clean opening.
    const machine = e.kind === "jack" || e.kind === "shunt";
    let reduction = 1;
    if (e.opened) reduction = machine ? 1.65 : 1.5;
    else if (machine) reduction = 0.27;
    else if (plated && facing) reduction = 0.69;
    const value = Math.max(1, Math.round(amount * s.power * reduction));
    const previousHp = e.hp;
    e.hp = Math.max(0, e.hp - value);
    if (e.boss && e.phase === 1 && previousHp > e.maxHp / 2 && e.hp <= e.maxHp / 2) {
      // Removing the first plate releases a physical second stroke. Every profession
      // sees its footprint, including builds strong enough to shear the plate in one burst.
      e.hp = Math.ceil(e.maxHp / 2);
      e.phase = 2;
      e.patterns = 1;
      attackPlan(s, e);
      cue(s, {
        matron: "Rear plate split · watch the sweep",
        shunt: "Second piston taking load",
        jack: "Cross guide taking load"
      }[e.kind]);
    }
    e.hit = 0.14;
    if (impulse && !e.boss && e.mode !== "charge") {
      const angle = angleTo(s.player, e);
      e.x += Math.cos(angle) * impulse;
      e.y += Math.sin(angle) * impulse;
      bounded(e, e.radius);
    }
    addEffect(s, "number", {
      x: e.x,
      y: e.y - e.radius - 9,
      value,
      heavy: e.opened
    }, 0.48);
    if (!e.hp) {
      s.kills++;
      s.waveKills++;
      const eligible = (s.wave === 1 && s.waveKills === 1) ||
        (s.wave === 2 && (s.waveKills === 1 || s.waveKills === 3));
      if (s.watchDepth === 0 && eligible) {
        const isColony = e.kind === "chalk" || e.kind === "crown";
        s.pickups.push({
          x: e.x, y: e.y,
          label: isColony ? "Seamglass chip" : "Bridle plate"
        });
      }
      addEffect(s, "break", {
        x: e.x,
        y: e.y,
        radius: e.radius + 9,
        kind: e.kind
      }, 0.32);
    }
  }

  function targets(s, reach, arc, direction = s.player.angle) {
    const p = s.player;
    const inSweep = s.enemies.filter(enemy => {
      const distance = dist(enemy, p);
      if (enemy.hp <= 0 || distance > reach + enemy.radius) return false;
      if (distance < enemy.radius + 9) return true;
      const silhouetteAngle = Math.asin(Math.min(1, enemy.radius / distance));
      return angleDiff(direction, angleTo(p, enemy)) <= arc + silhouetteAngle;
    });
    return inSweep.sort((a, b) => dist(a, p) - dist(b, p));
  }

  function nodePosition(s, n) {
    return n.enemy ? s.enemies.find(e => e.id === n.enemy && e.hp > 0) : n;
  }

  function appendNode(s, n) {
    if (n.enemy && s.nodes.some(old => old.enemy === n.enemy)) return;
    if (!n.enemy && s.nodes.some(old => !old.enemy && dist(n, old) < 18)) return;
    s.nodes.push(n);
    if (s.nodes.length > 3) s.nodes.shift();
  }

  function maxCableLength(s) {
    return s.technique === "hard-splice" ? 250 : 345;
  }

  function edges(s) {
    const nodes = s.nodes.map(n => nodePosition(s, n)).filter(Boolean);
    if (nodes.length === 1) nodes.unshift(s.player);
    return nodes.slice(1).map((b, i) => ({ a: nodes[i], b }))
      .filter(({ a, b }) => dist(a, b) <= maxCableLength(s));
  }

  function primary(s) {
    const p = s.player,
      spec = CLASSES[s.classId],
      reach = spec.reach * (s.style === "reach" ? 1.35 : 1);
    const damage = spec.damage * (s.style === "reach" ? 0.85 : 1);
    const melee = s.classId === "shorer";
    const list = targets(s, reach, melee ? 0.93 : 0.16);
    if (!melee) list.splice(1);
    p.attackCooldown = spec.rate / s.recovery;
    p.swing = 0.17;
    const end = list[0] && !melee ? list[0] : point(p.x + Math.cos(p.angle) * reach, p.y + Math.sin(p.angle) * reach);
    addEffect(s, melee ? "arc" : "cast", {
      x: p.x,
      y: p.y,
      angle: p.angle,
      radius: reach,
      endX: end.x,
      endY: end.y,
      classId: s.classId
    }, 0.16);
    sound(s, list.length ? "contact" : "primary");
    let follow = false;
    for (const e of list) {
      const bonus = s.mastery === "followthrough" && e.opened;
      follow ||= bonus;
      if (s.classId === "sounder" && bonus) read(s, e, 8);
      if (s.classId === "sounder") read(s, e, e.mode === "windup" || e.opened ? 40 : 20);
      if (s.classId === "linewright") appendNode(s, {
        enemy: e.id
      });
      hit(s, e, damage, melee ? 3 : 0);
    }
    if (list.length) {
      gain(s, (melee ? 14 : 12) + (follow ? 8 : 0));
      if (s.spill) {
        const near = s.enemies.find(e => e.hp > 0 && !list.includes(e) && dist(e, list[0]) <= 70);
        if (near) {
          hit(s, near, damage * 0.4);
          addEffect(s, "shear", {
            x: list[0].x,
            y: list[0].y,
            endX: near.x,
            endY: near.y
          }, 0.20);
        }
      }
    }
    updateReadings(s);
  }

  function tool(s) {
    const p = s.player;
    if (s.classId === "shorer") {
      if (s.stakes.length === 2) s.stakes.shift();
      s.stakes.push({
        x: p.x,
        y: p.y,
        time: 11
      });
      cue(s, "Foot seated");
    } else if (s.classId === "sounder") {
      let count = 0;
      for (const e of s.enemies)
        if (e.hp > 0 && dist(e, p) <= 205 + e.radius) {
          read(s, e, e.mode === "windup" ? 44 : 20);
          count++;
        }
      addEffect(s, "sounding", {
        x: p.x,
        y: p.y,
        radius: 205
      }, 0.36);
      cue(s, count ? "Interval taken" : "No return");
    } else {
      appendNode(s, {
        x: p.x,
        y: p.y
      });
      cue(s, "Guide pegged");
    }
    sound(s, "tool");
    p.toolCooldown = s.classId === "sounder" ? 2.4 : 0.75;
    updateReadings(s);
  }

  function spendHint(s) {
    const p = s.player;
    if (p.skillCooldown > 0) return "Recovering";
    if (p.resource < p.skillCost) {
      if (s.classId === "sounder") return "Read an enemy twice";
      if (s.classId === "linewright") return "Stretch a line or land hooks";
      return "Land strikes or catch a stroke";
    }
    if (s.classId === "sounder" && !targets(s, 290, .40).some(e => e.reading >= p.skillCost)) return "Aim at a read target";
    if (s.classId === "linewright" && !edges(s).length) return "Hook a target or set a guide";
    return "";
  }

  function skill(s) {
    const p = s.player,
      force = s.style === "force" ? 1.4 : 1;
    if (p.resource < p.skillCost) return false;
    if (s.classId === "sounder") {
      const e = targets(s, 290, 0.40).find(e => e.reading >= p.skillCost);
      if (!e) return false;
      const narrow = s.technique === "narrow-mouth";
      const answers = [e];
      if (narrow) {
        // Continue the first reading’s axis and choose the nearest charged target behind it.
        const axis = angleTo(p, e);
        const ux = Math.cos(axis), uy = Math.sin(axis);
        let second = null, nearest = Infinity;
        for (const other of s.enemies) {
          if (other === e || other.hp <= 0 || other.reading < p.skillCost) continue;
          const dx = other.x - e.x, dy = other.y - e.y;
          const forward = dx * ux + dy * uy;
          const lateral = Math.abs(dx * uy - dy * ux);
          if (forward > 0 && forward <= 130 && forward < nearest && lateral <= other.radius + 7) {
            nearest = forward;
            second = other;
          }
        }
        if (second) answers.push(second);
      }
      let origin = p;
      let precise = false;
      for (const target of answers) {
        const timed = target.mode === "windup" || target.opened;
        target.reading -= p.skillCost;
        addEffect(s, "return", { x: origin.x, y: origin.y, endX: target.x, endY: target.y }, 0.24);
        hit(s, target, (timed ? 66 : 42) * force * (narrow ? 0.80 : 1));
        if (timed && !target.boss && target.mode === "windup") recover(target, 0.65);
        precise ||= timed;
        origin = target;
      }
      cue(s, answers.length === 2 ? "Second interval carried" : precise ? "True interval" : "Return");
    } else if (s.classId === "shorer") {
      const split = s.technique === "split-heel";
      const radius = split ? 184 : 138;
      const sweep = split ? 15 * Math.PI / 180 : 1.28;
      const offset = 35 * Math.PI / 180;
      const directions = split ? [p.angle - offset, p.angle + offset] : [p.angle];
      const caught = new Set();
      for (const angle of directions) {
        for (const target of targets(s, radius, sweep, angle)) caught.add(target);
        addEffect(s, "shearFan", { x: p.x, y: p.y, angle, radius, sweep }, 0.26);
      }
      let a = p;
      for (const b of s.stakes) {
        if (dist(a, b) <= 300) {
          addEffect(s, "shear", {
            x: a.x,
            y: a.y,
            endX: b.x,
            endY: b.y
          }, 0.26);
          for (const e of s.enemies)
            if (segmentDistance(e, a, b) <= e.radius + 28) caught.add(e);
        }
        a = b;
      }
      for (const e of caught) hit(s, e, 47 * force, 18);
      p.resource -= p.skillCost;
    } else {
      const lines = edges(s);
      if (!lines.length) return false;
      const caught = new Set();
      const whipWidth = s.technique === "hard-splice" ? 50 : 27;
      for (const { a, b } of lines) {
        addEffect(s, "snap", {
          x: a.x, y: a.y, endX: b.x, endY: b.y, whipWidth
        }, 0.32);
        for (const e of s.enemies) {
          if (segmentDistance(e, a, b) <= e.radius + whipWidth) caught.add(e);
        }
      }
      for (const e of caught) {
        hit(s, e, 53 * force);
        const end = lines[0].a,
          d = dist(end, e);
        if (d > 1 && !e.boss) {
          const pull = Math.min(d, 40) / d;
          e.x += (end.x - e.x) * pull;
          e.y += (end.y - e.y) * pull;
          bounded(e, e.radius);
        }
      }
      s.nodes = [];
      p.resource -= p.skillCost;
    }
    sound(s, "skill");
    if (s.mastery === "quickstep") p.dodgeCooldown = Math.max(0, p.dodgeCooldown - 0.5);
    p.skillCooldown = 0.55;
    p.swing = 0.2;
    updateReadings(s);
    return true;
  }

  function recover(e, duration) {
    e.mode = "recover";
    e.timer = duration;
    e.shapes = [];
    e.opened = true;
  }

  function takeHit(s, shape, damage, cause) {
    const p = s.player;
    if (p.invulnerable > 0 || !intersects(shape, p)) return;
    if (s.classId === "shorer") {
      const i = s.stakes.findIndex(foot => dist(p, foot) <= 155 && intersects(shape, foot, 10));
      if (i !== -1) {
        sound(s, "guard");
        s.stakes.splice(i, 1);
        gain(s, 36);
        p.invulnerable = 0.25;
        addEffect(s, "guard", {
          x: p.x,
          y: p.y,
          radius: 40
        }, 0.3);
        cue(s, "Stroke caught");
        return;
      }
    }
    p.hp = Math.max(0, p.hp - Math.max(1, Math.round(damage)));
    p.invulnerable = 0.40;
    p.hit = 0.32;
    s.lastHitCause = cause;
    cue(s, cause);
    sound(s, p.hp === 0 ? "defeat" : "hurt");
    if (p.hp === 0) s.status = "defeat";
  }

  function line(x, y, angle, length, width) {
    return {
      type: "line",
      x,
      y,
      angle,
      length,
      width
    };
  }

  function disc(x, y, radius) {
    return {
      type: "disc",
      x,
      y,
      radius
    };
  }

  function attackPlan(s, e) {
    const p = s.player,
      late = e.phase === 2,
      i = e.patterns++;
    e.mode = "windup";
    e.opened = false;
    e.angle = angleTo(e, p);
    e.timer = e.boss ? 1.04 : 0.70;
    e.action = "strike";
    let shapes;
    switch (e.kind) {
      case "scout":
      case "mason":
      case "matron": {
        const wide = e.kind !== "scout",
          sweep = e.kind === "matron" && i % 2 === 1;
        if (sweep) {
          shapes = [disc(e.x, e.y, late ? 128 : 106)];
          e.actionName = "Mason plate sweep";
        } else {
          shapes = [line(e.x, e.y, e.angle, wide ? 213 : 180, e.radius * 1.75)];
          e.action = "rush";
          e.actionName = wide ? "Mason plate rush" : "Bridleshell rush";
        }
        break;
      }
      case "chalk": {
        shapes = [disc(p.x, p.y, 42)];
        if (s.tier >= 4 && i % 2 === 1) shapes.push(disc(p.x + Math.cos(e.angle + 1.57) * 56, p.y + Math.sin(e.angle + 1.57) * 56, 32));
        e.actionName = "Chalk eruption";
        e.timer = 0.88;
        break;
      }
      case "crown": {
        shapes = [line(e.x, e.y, e.angle, 280, 28)];
        if (s.tier >= 4 && i % 2 === 0) shapes.push(line(e.x, e.y, e.angle - 0.38, 260, 22));
        e.actionName = "Crown ridge";
        e.timer = 0.84;
        break;
      }
      case "shunt": {
        if (i % 2 === 0) {
          shapes = [line(e.x, e.y, e.angle, 740, 38)];
          if (late) shapes.push(line(e.x, e.y, e.angle + 0.24, 740, 31));
          e.actionName = "Shunt transfer";
        } else {
          shapes = [disc(e.x, e.y, 105), disc(p.x, p.y, 56)];
          if (late) shapes.push(line(e.x, e.y, e.angle + 0.28, 320, 32));
          e.actionName = "Pressure vent";
        }
        break;
      }
      case "jack": {
        if (i % 2 === 0) {
          shapes = [line(BANK.left, p.y, 0, BANK.right - BANK.left, 54)];
          if (late) shapes.push(line(p.x, BANK.top, Math.PI / 2, BANK.bottom - BANK.top, 42));
          e.actionName = "Guide stroke";
        } else {
          shapes = [{
            type: "ring",
            x: e.x,
            y: e.y,
            radius: 210,
            inner: 78
          }, disc(p.x, p.y, 36)];
          if (late) shapes.push(line(BANK.left, e.y, 0, BANK.right - BANK.left, 34));
          e.actionName = "Return knock";
        }
        break;
      }
    }
    e.duration = e.timer;
    e.shapes = shapes;
    e.vented = false;
  }

  function updateEnemy(s, e, dt) {
    if (e.hp <= 0) return;
    e.timer -= dt;
    e.hit = Math.max(0, e.hit - dt);
    e.readTime -= dt;
    if (e.readTime <= 0) e.reading = 0;
    if (e.mode === "approach") {
      const p = s.player,
        d = dist(e, p),
        forward = angleTo(e, p);
      e.angle = forward;
      if (e.timer <= 0 && d <= e.reach) {
        attackPlan(s, e);
        return;
      }
      if (e.speed > 0) {
        // Crowns grow ridges from the rear while a scout circles off the Mason's lead.
        const retreat = e.kind === "crown" && d < 112;
        const flank = e.kind === "scout" && d > e.reach && s.enemies.some(other => other.kind === "mason" && other.hp > 0);
        let bearing = forward;
        if (retreat) bearing += Math.PI;
        else if (flank) bearing += e.id % 2 ? 0.42 : -0.42;
        const room = retreat ? 112 - d : d - (e.kind === "crown" ? 154 : e.radius + 12);
        const travel = Math.max(0, Math.min(room, e.speed * dt));
        e.x += Math.cos(bearing) * travel;
        e.y += Math.sin(bearing) * travel;
        bounded(e, e.radius);
      }
    } else if (e.mode === "windup" && e.timer <= 0) {
      if (e.action === "rush") {
        e.mode = "charge";
        e.timer = 0.39;
        e.contact = false;
        e.struckShell = false;
      } else {
        for (const shape of e.shapes) {
          takeHit(s, shape, e.damage, e.actionName);
          addEffect(s, "impact", {
            shape
          }, 0.20);
        }
        recover(e, e.boss ? 1.55 : 0.80);
      }
    } else if (e.mode === "charge") {
      const shape = e.shapes[0],
        travel = Math.min(dt, Math.max(0, e.timer + dt)) * shape.length / 0.39;
      const sx = e.x,
        sy = e.y;
      e.x += Math.cos(shape.angle) * travel;
      e.y += Math.sin(shape.angle) * travel;
      bounded(e, e.radius);
      const swept = line(sx, sy, shape.angle, Math.hypot(e.x - sx, e.y - sy), shape.width);
      if (!e.contact && intersects(swept, s.player)) {
        takeHit(s, swept, e.damage, e.actionName);
        e.contact = true;
      }
      if (!e.struckShell) {
        const shell = s.enemies.find(other =>
          other !== e && other.hp > 0 && other.mode !== "charge" &&
          ["mason", "matron"].includes(other.kind) && intersects(swept, other, other.radius)
        );
        if (shell) {
          e.struckShell = true;
          recover(shell, shell.boss ? 0.95 : 1.25);
          shell.hp = Math.max(1, shell.hp - 12);
          addEffect(s, "break", {
            x: shell.x,
            y: shell.y,
            radius: shell.radius + 8
          }, 0.25);
          cue(s, "Foreplate unseated");
        }
      }
      if (e.kind !== "scout" && cartRut(s, e)) {
        recover(e, e.boss ? 2.1 : 1.75);
        cue(s, "Foreplate caught in cart ruts");
        addEffect(s, "break", {
          x: e.x,
          y: e.y,
          radius: e.radius + 6
        }, .28);
      } else if (e.timer <= 0) recover(e, e.boss ? 1.45 : 0.90);
    } else if (e.mode === "recover" && e.timer <= 0) {
      e.mode = "approach";
      e.opened = false;
      e.timer = e.boss ? 0.62 : 0.55;
      if (e.boss && e.phase === 2) e.timer *= 0.60;
      if (s.tier >= 4) e.timer *= 0.75;
    }
  }

  function updateHazards(s, dt) {
    if (!s.modifiers.includes("surge")) return;
    s.hazardTimer -= dt;
    if (s.hazardTimer <= 0) {
      const p = s.player,
        vertical = random(s) < 0.5;
      const shape = vertical ? line(p.x, BANK.top, Math.PI / 2, BANK.bottom - BANK.top, 59) : line(BANK.left, p.y, 0, BANK.right - BANK.left, 59);
      s.hazards.push({
        shape,
        timer: 1.2,
        duration: 1.2
      });
      s.hazardTimer = 5.8;
    }
    for (const h of s.hazards) {
      h.timer -= dt;
      if (h.timer <= 0) {
        takeHit(s, h.shape, (13 + s.tier * 2) * s.deepDamage, "Cross-surge");
        addEffect(s, "impact", {
          shape: h.shape
        }, 0.24);
      }
    }
    s.hazards = s.hazards.filter(h => h.timer > 0);
  }

  function separate(s) {
    const units = s.enemies;
    for (let i = 0; i < units.length; i++)
      for (let j = i + 1; j < units.length; j++) {
        const a = units[i],
          b = units[j],
          d = dist(a, b),
          overlap = a.radius + b.radius + 3 - d;
        if (overlap <= 0 || d < 0.001) continue;
        const ax = a.mode === "approach" && a.speed > 0,
          bx = b.mode === "approach" && b.speed > 0;
        const k = overlap / (d * ((ax && bx) ? 2 : 1)),
          x = (b.x - a.x) * k,
          y = (b.y - a.y) * k;
        if (ax) {
          a.x -= x;
          a.y -= y;
          bounded(a, a.radius);
        }
        if (bx) {
          b.x += x;
          b.y += y;
          bounded(b, b.radius);
        }
      }
  }

  function ventAvailable(s) {
    return s.enemies.some(e =>
      e.boss && e.kind !== "matron" && e.opened && !e.vented &&
      e.hp > 0 && dist(s.player, e) <= e.radius + 50
    );
  }

  function workFitting(s) {
    if (!ventAvailable(s)) return;
    const e = s.enemies.find(target => target.boss);
    e.vented = true;
    addEffect(s, "sounding", {
      x: e.x,
      y: e.y,
      radius: 65
    }, 0.3);
    hit(s, e, 24);
    cue(s, "Collar vented");
    sound(s, "work");
  }

  function cartRut(s, body) {
    return s.site === "quay" && segmentDistance(body, point(89, 466), point(285, 340)) < 25;
  }

  function advance(s, input, dt) {
    if (s.status !== "active") return;
    const p = s.player;
    s.elapsed += dt;
    s.effects.forEach(f => {
      f.ttl -= dt;
    });
    s.effects = s.effects.filter(f => f.ttl > 0);
    s.stakes.forEach(f => {
      f.time -= dt;
    });
    s.stakes = s.stakes.filter(f => f.time > 0);
    s.cueTime = Math.max(0, s.cueTime - dt);
    const timers = ["attackCooldown", "toolCooldown", "skillCooldown", "dodgeCooldown", "invulnerable", "hit", "swing"];
    for (const key of timers) p[key] = Math.max(0, p[key] - dt);
    // Snapshot endpoints before either the player or a hooked enemy takes a step.
    const oldEdges = s.classId === "linewright"
      ? edges(s).map(({ a, b }) => ({ a, b, length: dist(a, b) }))
      : [];
    const moveX = clamp(Number(input.x) || 0, -1, 1),
      moveY = clamp(Number(input.y) || 0, -1, 1);
    const moving = Math.hypot(moveX, moveY);
    if (Number.isFinite(input.aimX) && Number.isFinite(input.aimY)) {
      p.angle = angleTo(p, point(input.aimX, input.aimY));
    } else if (s.enemies.length) {
      const nearest = s.enemies.reduce((a, b) => dist(a, p) < dist(b, p) ? a : b);
      p.angle = angleTo(p, nearest);
    } else if (moving) {
      p.angle = Math.atan2(moveY, moveX);
    }
    const workPressed = Boolean(input.interact) && !s.previous.interact;
    s.previous.interact = Boolean(input.interact);
    for (const key of ["dodge", "skill", "tool"]) {
      if (input[key] && !s.previous[key]) s.buffer[key] = 0.16;
      else s.buffer[key] = Math.max(0, s.buffer[key] - dt);
      s.previous[key] = Boolean(input[key]);
    }
    if (s.buffer.dodge && p.dodgeCooldown === 0) {
      sound(s, "dodge");
      p.dash = 0.19;
      p.invulnerable = 0.20;
      p.dashAngle = moving ? Math.atan2(moveY, moveX) : p.angle;
      p.dodgeCooldown = 1.5 * (s.style === "flow" ? 0.7 : 1);
      addEffect(s, "evade", {
        x: p.x,
        y: p.y,
        angle: p.dashAngle
      }, 0.24);
      s.buffer.dodge = 0;
    }
    if (p.dash > 0) {
      const travel = Math.min(dt, p.dash) * 525;
      p.x += Math.cos(p.dashAngle) * travel;
      p.y += Math.sin(p.dashAngle) * travel;
      p.dash = Math.max(0, p.dash - dt);
    } else {
      if (moving) {
        p.x += moveX / Math.max(1, moving) * 172 * dt;
        p.y += moveY / Math.max(1, moving) * 172 * dt;
      }
      if (s.buffer.tool && p.toolCooldown === 0) {
        tool(s);
        s.buffer.tool = 0;
      }
      if (s.buffer.skill && p.skillCooldown === 0 && skill(s)) s.buffer.skill = 0;
      if (input.primary && p.attackCooldown === 0) primary(s);
    }
    bounded(p, 9);
    if (input.interact && s.workOrder && !s.workOrder.done && dist(p, s.workOrder) <= WORK_REACH) {
      s.workOrder.done = true;
      p.hp = Math.min(p.maxHp, p.hp + 10);
      cue(s, s.workOrder.doneText || "Haul made safe");
      addEffect(s, "guard", {
        x: s.workOrder.x,
        y: s.workOrder.y,
        radius: 42
      }, 0.4);
      sound(s, "work");
    } else if (workPressed) workFitting(s);
    for (const e of s.enemies) updateEnemy(s, e, dt);
    separate(s);
    for (const before of oldEdges) {
      const now = dist(before.a, before.b);
      if (now > 40 && now <= maxCableLength(s) && now > before.length) gain(s, Math.min(9, now - before.length) * 0.30);
    }
    updateHazards(s, dt);
    s.enemies = s.enemies.filter(e => e.hp > 0);
    s.nodes = s.nodes.filter(n => !n.enemy || nodePosition(s, n));
    updateReadings(s);
    if (s.status !== "active") return;
    s.pickups = s.pickups.filter(piece => {
      if (dist(p, piece) > 46) return true;
      s.salvageCollected++;
      cue(s, piece.label + " recovered");
      return false;
    });
    if (s.reinforcement && s.enemies.length <= 1) {
      const r = s.reinforcement;
      if (r.timer === null) {
        r.timer = 1.45;
        cue(s, "Movement on the bank");
      }
      r.timer -= dt;
      if (r.timer <= 0) {
        r.roster.forEach((kind, i) => spawnFoe(s, kind, r.x + 36 * (i - 1), r.y + 20 * (i % 2)));
        s.reinforcement = null;
      }
      return;
    }
    if (s.enemies.length) return;
    if (s.wave === s.waveCount) {
      sound(s, "victory");
      s.status = "victory";
      s.objective = "Route secured";
      return;
    }
    s.waveTime += dt;
    if (s.waveTime >= 1.45) {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.14);
      spawnWave(s);
      cue(s, "Crew dressed your cuts");
    }
  }

  function step(s, input = {}, dt = 1 / 60) {
    let left = Number.isFinite(dt) ? clamp(dt, 0, 0.25) : 0;
    while (left > 0.000001) {
      const t = Math.min(left, 1 / 60);
      advance(s, input, t);
      left -= t;
    }
    return s;
  }
  return {
    WIDTH,
    HEIGHT,
    BANK,
    WORK_REACH,
    CLASSES,
    createEncounter,
    step,
    edges,
    intersects,
    spendHint,
    ventAvailable
  };
});
