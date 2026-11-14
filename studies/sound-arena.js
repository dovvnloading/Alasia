/* Cached shore paintings with the simulation's exact danger footprints on top. */
(function (root) {
  "use strict";
  const W = 960,
    H = 540,
    TAU = 2 * Math.PI,
    cache = new WeakMap();
  const palettes = {
    quay: {
      water: "#294d51",
      deep: "#142e34",
      ground: "#67736b",
      light: "#b9bba4",
      dark: "#43554f",
      join: "#43534d",
      trim: "#a18b68"
    },
    cut: {
      water: "#384a47",
      deep: "#202c32",
      ground: "#6c6861",
      light: "#bfb293",
      dark: "#514d49",
      join: "#4e4b45",
      trim: "#a57c57"
    },
    sill: {
      water: "#2c424b",
      deep: "#182931",
      ground: "#5a6a6e",
      light: "#a8b4ae",
      dark: "#445156",
      join: "#414d52",
      trim: "#a28a65"
    }
  };

  function path(c, points, close) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
    if (close) c.closePath();
  }

  function line(c, pts, color, w = 1) {
    path(c, pts, false);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke();
  }

  function poly(c, pts, fill, edge, w = 1) {
    path(c, pts, true);
    c.fillStyle = fill;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = w;
      c.stroke();
    }
  }

  function oval(c, x, y, rx, ry, color, edge, w = 1) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
    c.fillStyle = color;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = w;
      c.stroke();
    }
  }

  function local(c, x, y, a, fn) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    fn();
    c.restore();
  }

  function stoneWall(c, x, y, w, h, p) {
    c.fillStyle = p.dark;
    c.fillRect(x, y + 3, w, h);
    c.fillStyle = p.light;
    c.fillRect(x, y, w, h - 4);
    c.fillStyle = p.ground;
    c.fillRect(x + 2, y + 1, w - 4, h - 7);
  }

  function wheel(c, x, y, r, p) {
    oval(c, x + 4, y + 5, r + 4, r + 2, "#17292c7a");
    for (let i = 0; i < 12; i++) local(c, x, y, i * TAU / 12, () => {
      c.fillStyle = "#514d40";
      c.fillRect(r - 4, -3, 8, 6);
    });
    oval(c, x, y, r, r, "#625d4e", p.light, 1.6);
    oval(c, x, y, r - 4, r - 4, p.dark, "#262f2c", 1.5);
    for (let i = 0; i < 5; i++) local(c, x, y, i * TAU / 5, () => line(c, [
      [0, 0],
      [r - 5, 0]
    ], p.trim, 3));
    oval(c, x, y, 4, 4, p.trim, "#3a3b32");
  }

  function post(c, x, y) {
    oval(c, x + 3, y + 4, 8, 5, "#1c292c75");
    oval(c, x, y, 5, 7, "#4b4337", "#292e2c", 1);
    oval(c, x, y - 3, 5, 4, "#b9a57f", "#443f35");
    oval(c, x, y - 3, 2, 1.6, "#76674c");
  }

  function boat(c, x, y, a) {
    local(c, x, y, a, () => {
      poly(c, [
        [-45, 0],
        [-24, -12],
        [21, -11],
        [47, 0],
        [23, 12],
        [-22, 12]
      ], "#363e38", "#192f32", 2);
      poly(c, [
        [-39, 0],
        [-21, -8],
        [20, -8],
        [40, 0],
        [20, 8],
        [-20, 8]
      ], "#877c5f", "#c2b58e", 1.6);
      for (let v = -20; v <= 20; v += 10) line(c, [
        [v, -7],
        [v, 8]
      ], "#554d3c", 3);
    });
  }

  function masonry(c, r, p, site) {
    const ground = [
      [20, 70],
      [47, 42],
      [887, 41],
      [941, 67],
      [940, 466],
      [914, 503],
      [41, 504],
      [20, 483]
    ];
    poly(c, ground.map(([x, y]) => [x + 6, y + 11]), "#14292d9e");
    poly(c, ground, p.ground, p.deep, 2);
    c.save();
    path(c, ground, true);
    c.clip();
    const h = site === "sill" ? 37 : 45;
    for (let row = 0; row < 14; row++) {
      const y = 32 + row * h;
      for (let x = -(row % 2) * 41 - 20; x < 960;) {
        const span = 65 + Math.floor(r() * 51),
          n = 2 + r() * 3;
        const pts = [
          [x + n, y + 1],
          [x + span - 4, y + 2],
          [x + span - 1, y + 6],
          [x + span - 2, y + h - 4],
          [x + span - 6, y + h - 1],
          [x + 4, y + h - 2],
          [x + 1, y + h - 6]
        ];
        poly(c, pts, r() > .5 ? "#d5cbb10b" : "#0e252622", p.join, 1.3);
        line(c, [pts[6], pts[0], pts[1]], "#e0d6ba36", 1.2);
        if (r() < 0.18) line(c, [
          [x + span * .3, y + h],
          [x + span * .5, y + h * .47],
          [x + span * .55, y + h * .4],
          [x + span * .56, y + h * .27]
        ], "#2038335c", .7);
        x += span;
      }
    }
    for (let i = 0; i < 3700; i++) {
      const x = r() * 960,
        y = 35 + r() * 480,
        len = 0.8 + Math.pow(r(), 3) * 6;
      line(c, [
        [x, y],
        [x + len, y - len * .25]
      ], r() < .54 ? "#ece6c51f" : "#0a21252e", r() + .35);
    }
    // Small material variations keep the fighting surface legible at full speed.
    for (let i = 0; i < 28; i++) {
      const x = r() * W,
        y = r() * H,
        rad = 20 + r() * 75;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, r() < .5 ? "#b29c6247" : "#314d4d55");
      g.addColorStop(1, "#81918400");
      c.fillStyle = g;
      c.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
    }
    c.restore();
  }

  function finishStone(c, p, site) {
    // The workers laid each deck for a different job: loading boards, a shunt
    // inspection trench, or stepped guide beds under the five working jacks.
    if (site === "quay") {
      poly(c, [
        [43, 68],
        [181, 45],
        [236, 47],
        [110, 140],
        [45, 165]
      ], "#8c8b6e55");
      poly(c, [
        [832, 448],
        [909, 404],
        [918, 488],
        [740, 492]
      ], "#87948a42");
      for (let k = 0; k < 14; k++) {
        const x = 47 + k * 9;
        line(c, [
          [x, 70],
          [x + 19, 66],
          [x + 34, 70]
        ], "#ccd0ae44", 1.2);
      }
      for (let j = 0; j < 26; j++) {
        const x = 44 + (j * 7) % 37,
          y = 77 + (j * 23) % 331;
        line(c, [
          [x, y],
          [x + 3, y - 8],
          [x + 3, y - 14]
        ], "#9fa88185", 1.2);
      }
    } else if (site === "cut") {
      c.save();
      c.translate(540, 271);
      c.rotate(-.30);
      c.fillStyle = "#2f333244";
      c.fillRect(-211, -53, 422, 106);
      for (const side of [-1, 1]) {
        line(c, [
          [-214, side * 53],
          [214, side * 53]
        ], "#3338328c", 5);
        line(c, [
          [-213, side * 51],
          [213, side * 51]
        ], "#d0b58c8c", 2);
      }
      for (let x = -200; x < 200; x += 31) {
        line(c, [
          [x, -48],
          [x, 48]
        ], "#3c423d75", 2);
        oval(c, x + 4, -41, 2, 2, "#aaa99188");
        oval(c, x + 4, 41, 2, 2, "#aaa99188");
      }
      for (let x = -202; x <= 206; x += 102) {
        for (let y = -25; y <= 25; y += 10) line(c, [
          [x, y],
          [x + 37, y]
        ], "#323932bb", 3.6);
      }
      c.restore();
    } else {
      for (let n = 0; n < 3; n++) {
        const x = 138 + n * 283,
          y = 226 + (n % 2) * 120;
        c.save();
        c.translate(x, y);
        c.rotate(-.16);
        poly(c, [
          [-31, -29],
          [28, -29],
          [34, -22],
          [34, 22],
          [25, 30],
          [-32, 27]
        ], "#53606391", "#93a09a77", 1.4);
        oval(c, 0, 0, 21, 19, "#44535595", "#93a29a77", 2);
        oval(c, 0, 0, 12, 11, "#3d4e5090", "#98a59866", 1.4);
        for (const sx of [-23, 23])
          for (const sy of [-20, 20]) oval(c, sx, sy, 2.5, 2.3, "#b4b08d8f");
        c.restore();
      }
    }
  }

  function quayDetails(c, p) {
    for (let x = 55; x < 915; x += 39) stoneWall(c, x, 42, 37, 12, p);
    for (let x = 55; x < 546; x += 37) stoneWall(c, x, 494, 36, 9, p);
    for (let i = -1; i <= 1; i += 2) {
      const points = [
        [89 + i * 8, 466 + i * 12],
        [285 + i * 8, 340 + i * 12]
      ];
      line(c, points, "#35443ea1", 5);
      line(c, points.map(([x, y]) => [x + 2, y + 2]), "#d5c6a774", 1.5);
      for (let j = 0; j < 10; j++) {
        const t = j / 10,
          x = points[0][0] * (1 - t) + points[1][0] * t,
          y = points[0][1] * (1 - t) + points[1][1] * t;
        line(c, [
          [x - 1, y - 2],
          [x + 2, y + 2]
        ], "#33443e9c", 1.1);
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = 126 + i * 160;
      post(c, x, 47);
      post(c, x + 69, 495);
    }
    boat(c, 737, 518, -.04);
    boat(c, 841, 519, .06);
    boat(c, 328, 19, .05);
    c.save();
    c.strokeStyle = "#b2a280";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(773, 515);
    c.quadraticCurveTo(806, 521, 844, 494);
    c.stroke();
    c.restore();
  }

  function cutDetails(c, p) {
    for (let k = 0; k < 4; k++) {
      const x = 114 + k * 205;
      for (let i = 0; i < 6; i++) stoneWall(c, x + i * 13, 33, 12, 20, p);
      wheel(c, x + 43, 37, 13, p);
      for (let i = 0; i < 10; i++) line(c, [
        [x + i * 8, 489],
        [x + i * 8 - 3, 510]
      ], "#212e2b", 3);
      line(c, [
        [x - 6, 491],
        [x + 77, 491]
      ], p.trim, 2);
    }
    for (const y of [192, 347]) {
      line(c, [
        [45, y],
        [918, y]
      ], "#332d2a55", 3);
      line(c, [
        [45, y + 2],
        [918, y + 2]
      ], "#c4ac7e5c", 1.2);
    }
    for (let i = 0; i < 6; i++) {
      c.fillStyle = "#494940";
      c.fillRect(21, 96 + i * 62, 22, 23);
      c.fillStyle = "#a09575";
      c.fillRect(23, 96 + i * 62, 19, 2);
    }
  }

  function sillDetails(c, p) {
    for (let k = 0; k < 5; k++) {
      const x = 101 + k * 179;
      stoneWall(c, x - 32, 24, 66, 33, p);
      wheel(c, x, 35, 15, p);
      line(c, [
        [x - 7, 49],
        [x - 7, 482]
      ], "#283c421c", 4);
      line(c, [
        [x + 7, 49],
        [x + 7, 482]
      ], "#283c421c", 4);
      stoneWall(c, x - 35, 483, 74, 24, p);
      wheel(c, x, 504, 17, p);
      for (let i = 0; i < 4; i++) line(c, [
        [x - 26 + i * 15, 480],
        [x - 22 + i * 15, 487]
      ], "#cabf9777", 3.5);
    }
    for (const x of [38, 921])
      for (let y = 76; y < 472; y += 45) stoneWall(c, x - 7, y, 14, 36, p);
  }

  function terrain(canvas, s) {
    let saved = cache.get(canvas);
    const key = s.site + ":" + s.seed;
    if (saved && saved.key === key) return saved.image;
    const image = canvas.ownerDocument.createElement("canvas");
    image.width = W * 1.5;
    image.height = H * 1.5;
    const c = image.getContext("2d");
    c.scale(1.5, 1.5);
    c.lineJoin = "round";
    c.lineCap = "round";
    const p = palettes[s.site],
      g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, p.water);
    g.addColorStop(.65, p.deep);
    g.addColorStop(1, p.water);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    let word = 943081;
    for (const ch of String(s.seed)) word = Math.imul(word ^ ch.charCodeAt(0), 16777619) >>> 0;
    const r = () => {
      word = (Math.imul(1664525, word) + 1013904223) >>> 0;
      return word / 4294967296;
    };
    for (let i = 0; i < 1700; i++) {
      const x = r() * W,
        y = r() * H,
        len = 3 + r() * 19;
      line(c, [
        [x, y],
        [x + len * .63, y - 1.1],
        [x + len, y - 1]
      ], r() < .55 ? "#b5ccae38" : "#0e262e55", .35 + r());
    }
    masonry(c, r, p, s.site);
    finishStone(c, p, s.site);
    if (s.site === "quay") quayDetails(c, p);
    else if (s.site === "cut") cutDetails(c, p);
    else sillDetails(c, p);
    const shade = c.createRadialGradient(456, 261, 163, 460, 252, 550);
    shade.addColorStop(0, "#14262800");
    shade.addColorStop(1, "#0b202c67");
    c.fillStyle = shade;
    c.fillRect(0, 0, W, H);
    cache.set(canvas, {
      key,
      image
    });
    return image;
  }

  function footprint(c, shape, fill, edge, w = 1.7) {
    c.save();
    c.fillStyle = fill;
    c.strokeStyle = edge;
    c.lineWidth = w;
    c.beginPath();
    if (shape.type === "line") {
      c.translate(shape.x, shape.y);
      c.rotate(shape.angle);
      const r = shape.width / 2,
        L = shape.length;
      c.moveTo(0, -r);
      c.lineTo(L, -r);
      c.arc(L, 0, r, -Math.PI / 2, Math.PI / 2);
      c.lineTo(0, r);
      c.arc(0, 0, r, Math.PI / 2, 3 * Math.PI / 2);
      c.closePath();
    } else {
      c.arc(shape.x, shape.y, shape.radius, 0, TAU);
      if (shape.type === "ring") {
        c.moveTo(shape.x + shape.inner, shape.y);
        c.arc(shape.x, shape.y, shape.inner, 0, TAU, true);
      }
    }
    c.fill("evenodd");
    c.stroke();
    c.restore();
  }

  function tell(c, sh, progress) {
    footprint(c, sh, "rgba(112,34,20," + (.21 + .17 * progress) + ")", "#281b18", 3.9);
    footprint(c, sh, "transparent", progress > .72 ? "#ffdb98" : "#f4b778", 1.7);
    if (sh.type === "line") {
      local(c, sh.x, sh.y, sh.angle, () => {
        const len = Math.min(190, sh.length),
          y = sh.width * .20;
        for (let x = 19; x < len; x += 29) line(c, [
          [x - y, -y],
          [x, 0],
          [x - y, y]
        ], "#ffeac57d", 1.7);
        line(c, [
          [0, 0],
          [sh.length * progress, 0]
        ], "#ffe7bba3", 2);
      });
    } else {
      const r = sh.type === "ring" ? sh.inner + (sh.radius - sh.inner) * progress : sh.radius * (.28 + .72 * progress);
      c.beginPath();
      c.arc(sh.x, sh.y, r, 0, TAU);
      c.setLineDash([5, 5]);
      c.strokeStyle = "#ffe3b6b0";
      c.lineWidth = 1.5;
      c.stroke();
      c.setLineDash([]);
    }
  }

  function stake(c, x, y) {
    poly(c, [
      [x - 6, y + 3],
      [x - 1, y - 7],
      [x + 5, y - 2],
      [x + 5, y + 4]
    ], "#313839", "#e9cd90", 1.6);
    line(c, [
      [x - 1, y - 7],
      [x + 2, y - 13]
    ], "#f4d493", 2.5);
  }

  function classGeometry(c, s) {
    let a = s.player;
    for (const b of s.stakes) {
      if (Math.hypot(a.x - b.x, a.y - b.y) <= 300) {
        line(c, [
          [a.x, a.y],
          [b.x, b.y]
        ], "#2e3333", 3.5);
        line(c, [
          [a.x, a.y],
          [b.x, b.y]
        ], "#f3d59bbd", 1.4);
      }
      stake(c, b.x, b.y);
      a = b;
    }
    for (const { a, b } of root.SoundCombat.edges(s)) {
      line(c, [
        [a.x, a.y],
        [b.x, b.y]
      ], "#13282b", 4.5);
      line(c, [
        [a.x, a.y],
        [b.x, b.y]
      ], "#e8c992", s.technique === "hard-splice" ? 3.3 : 2);
    }
    for (const n of s.nodes)
      if (!n.enemy) stake(c, n.x, n.y);
  }

  function shelled(c, e, phase, armored) {
    const r = e.radius,
      ink = "#212b28";
    const dark = e.hit ? "#b99e78" : "#4d5145",
      fill = e.hit ? "#f0d7a9" : e.kind === "scout" ? "#9b9073" : "#9a8061";
    local(c, e.x, e.y, e.angle, () => {
      c.scale(r / 19, r / 19);
      for (let i = 0; i < 3; i++)
        for (const sign of [-1, 1]) {
          const x = -9 + i * 9,
            foot = phase * (i % 2 === 0 ? 1 : -1);
          line(c, [
            [x, sign * 8],
            [x - 4 + foot, sign * 15],
            [x - 10 + foot, sign * 18]
          ], ink, 3.3);
          line(c, [
            [x, sign * 8],
            [x - 4 + foot, sign * 15]
          ], "#9e9576", 1.7);
        }
      poly(c, [
        [-20, -5],
        [-12, -10],
        [-3, -9],
        [3, 0],
        [-2, 9],
        [-15, 10],
        [-21, 3]
      ], e.opened ? "#f8dea8" : "#b2a587", ink, 1.6);
      for (let i = 0; i < 4; i++) line(c, [
        [-17 + i * 3, -4],
        [-16 + i * 3, 4]
      ], dark, 1.2);
      poly(c, [
        [-10, -10],
        [-1, -14],
        [11, -14],
        [18, -7],
        [20, 0],
        [17, 8],
        [6, 14],
        [-5, 13],
        [-13, 6]
      ], fill, ink, 1.9);
      poly(c, [
        [-10, 0],
        [-4, -10],
        [7, -12],
        [14, -7],
        [3, -4]
      ], "#cabb945f");
      for (const sign of [-1, 1]) {
        line(c, [
          [-6, sign * 7],
          [2, sign * 10],
          [13, sign * 7],
          [17, sign * 4]
        ], "#433f34", 3);
        line(c, [
          [-6, sign * 7],
          [2, sign * 9],
          [13, sign * 6],
          [17, sign * 4]
        ], "#e6cc97", 1.4);
      }
      if (armored) line(c, [
        [13, -11],
        [20, -5],
        [21, 3],
        [15, 10]
      ], "#f0c58b", 2.3);
    });
  }

  function colony(c, e, phase) {
    local(c, e.x, e.y, e.angle, () => {
      const r = e.radius;
      for (let i = 0; i < 7; i++) local(c, 0, 0, i * TAU / 7 + e.id, () => {
        const h = r * (.60 + (i % 3) * .14);
        line(c, [
          [0, 0],
          [r * .53, 2],
          [h + 5 + phase * .3, 4],
          [h + 10, 1]
        ], "#383c34", 2.4);
        poly(c, [
          [1, -2],
          [h * .6, -4],
          [h + 2, 1],
          [h * .45, 4]
        ], e.hit ? "#fff3d3" : "#cdc5a0", "#525d4e", 1.2);
      });
      for (let i = 0; i < 5; i++) local(c, 0, 0, i * TAU / 5, () => {
        poly(c, [
          [-3, 0],
          [0, -r * .50],
          [r * .29, -r * .25],
          [r * .15, 3]
        ], e.opened ? "#f8e1a6" : "#c6b997", "#495a4c", 1.1);
      });
      oval(c, 0, 0, 3, 3, "#684b3c");
    });
  }

  function machine(c, e, t) {
    local(c, e.x, e.y, 0, () => {
      const jack = e.kind === "jack",
        r = e.radius;
      for (let i = 0; i < (jack ? 4 : 3); i++) local(c, 0, 0, i * TAU / (jack ? 4 : 3) + .15, () => {
        poly(c, [
          [6, -8],
          [r + 3, -7],
          [r + 6, 1],
          [r - 3, 7],
          [6, 6]
        ], "#59615c", "#182b2e", 2);
        line(c, [
          [11, -5],
          [r - 2, -5]
        ], "#acb6a0", 2);
        oval(c, r - 2, 0, 3, 3, "#c6b794", "#394844");
      });
      oval(c, 0, 0, r * .68, r * .72, "#303c3b", "#acaa8b", 2);
      oval(c, 0, 0, r * .48, r * .51, "#6e7467", "#2d3531", 3);
      local(c, 0, 0, e.opened ? Math.PI * .28 : e.mode === "windup" ? t * .6 : 0, () => {
        poly(c, [
          [-5, -r * .6],
          [6, -r * .6],
          [10, r * .35],
          [2, r * .56],
          [-7, r * .35]
        ], e.hit ? "#ffe2a7" : e.opened ? "#edc878" : "#b2895d", "#483f30", 2);
        line(c, [
          [-1, -r * .49],
          [3, r * .23]
        ], "#ead7ac", 1.8);
      });
    });
  }

  function actor(c, e, t, calm, armored) {
    const phase = calm || e.mode !== "approach" ? 0 : Math.sin(t * 11 + e.id) * 1.9;
    oval(c, e.x + 3, e.y + 5, e.radius + 3, e.radius * .64, "#182c2c66");
    if (e.kind === "shunt" || e.kind === "jack") machine(c, e, t);
    else if (e.kind === "chalk" || e.kind === "crown") colony(c, e, phase);
    else shelled(c, e, phase, armored);
    if (armored && (e.kind === "chalk" || e.kind === "crown" || e.kind === "shunt" || e.kind === "jack") && !e.opened) {
      c.beginPath();
      c.arc(e.x, e.y, e.radius + 3, e.angle - .86, e.angle + .86);
      c.strokeStyle = "#efc38a";
      c.lineWidth = 2.4;
      c.stroke();
    }
    if (e.opened && e.boss) {
      c.save();
      c.setLineDash([6, 5]);
      c.beginPath();
      c.arc(e.x, e.y, e.radius + 5, 0, TAU);
      c.strokeStyle = "#f9df9e";
      c.lineWidth = 2.4;
      c.stroke();
      c.restore();
    }
    if (e.reading) {
      for (let i = 0; i < Math.ceil(e.reading / 20); i++) {
        c.beginPath();
        c.arc(e.x, e.y, e.radius + 4 + i * 3, -1.9, -1.20);
        c.strokeStyle = "#d7fff1";
        c.lineWidth = 2.3;
        c.stroke();
      }
    }
    if (e.hp < e.maxHp || e.boss) {
      const w = e.boss ? 64 : 24,
        y = e.y - e.radius - 10;
      c.fillStyle = "#1b2828";
      c.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5);
      c.fillStyle = e.opened ? "#efd590" : "#d59973";
      c.fillRect(e.x - w / 2, y, w * e.hp / e.maxHp, 3);
      if (e.boss) {
        c.fillStyle = "#343b35";
        c.fillRect(e.x - .5, y, 1, 3);
      }
    }
  }

  function worker(c, s, t, calm) {
    const p = s.player,
      col = s.classId === "shorer" ? "#c88655" : s.classId === "sounder" ? "#78b8ac" : "#d9bb65";
    oval(c, p.x + 4, p.y + 6, 14, 9, "#17262477");
    c.beginPath();
    c.ellipse(p.x, p.y + 2, 15, 12, 0, 0, TAU);
    c.strokeStyle = p.hit ? "#ffbb91" : "#ebead3";
    c.lineWidth = 1.6;
    c.stroke();
    local(c, p.x, p.y, p.angle, () => {
      c.scale(1.14, 1.14);
      line(c, [
        [-8, -4],
        [-13, -6]
      ], "#253437", 4);
      line(c, [
        [-8, 4],
        [-12, 7]
      ], "#253437", 4);
      poly(c, [
        [-11, -5],
        [-6, -11],
        [2, -9],
        [8, -4],
        [5, 6],
        [-5, 10],
        [-12, 6]
      ], col, "#24302f", 1.7);
      poly(c, [
        [-10, -5],
        [-7, -9],
        [0, -8],
        [-2, -4],
        [-7, 0]
      ], "#f4e2b75f");
      if (s.classId === "shorer") {
        poly(c, [
          [-7, 4],
          [-3, 7],
          [-6, 11],
          [-11, 8]
        ], "#778783", "#344444", 1.2);
      } else if (s.classId === "linewright") {
        for (let k = 0; k < 3; k++) oval(c, -7 + k * 2, 3 + k, 4, 2.5, "#a39569", "#e0d0a2", .8);
      } else {
        line(c, [
          [-10, 5],
          [-7, 9],
          [1, 11]
        ], "#cddab9", 1.6);
      }
      line(c, [
        [-8, -6],
        [-4, -2],
        [0, 6]
      ], "#e1d2a7", 2.3);
      line(c, [
        [3, -6],
        [8, -8],
        [13, -5]
      ], "#394442", 4);
      line(c, [
        [1, 5],
        [7, 7],
        [11, 3]
      ], col, 3.3);
      const swing = calm ? 0 : p.swing * 3.6;
      local(c, 4, 1, -swing, () => {
        if (s.classId === "shorer") {
          line(c, [
            [2, 7],
            [18, -8]
          ], "#29322f", 4);
          line(c, [
            [2, 7],
            [18, -8]
          ], "#c9a978", 2.3);
          poly(c, [
            [13, -11],
            [18, -15],
            [25, -7],
            [20, -3]
          ], "#b9b6a1", "#3e4944", 1.5);
        } else if (s.classId === "sounder") {
          line(c, [
            [4, 5],
            [19, -6]
          ], "#e4d3ad", 2.5);
          oval(c, 19, -6, 3.7, 3.7, "#536e68", "#cdd7ba", 1.2);
        } else {
          oval(c, 8, 6, 4, 5, "#87774d", "#dfcca3", 1.3);
          line(c, [
            [6, -5],
            [15, -7],
            [18, -4],
            [19, -1]
          ], "#d8c9a3", 2.1);
        }
      });
      oval(c, 0, -1, 5.5, 6.1, "#c8af85", "#3c4139", 1.3);
      oval(c, -1, -2.1, 4.8, 4.1, "#576659");
      line(c, [
        [1, -5],
        [4, -2],
        [4, 1]
      ], "#d3c6a1", 1);
    });
  }

  function work(c, s) {
    const order = s.workOrder;
    if (!order) return;
    const {
      x,
      y
    } = order, close = Math.hypot(s.player.x - x, s.player.y - y) <= root.SoundCombat.WORK_REACH;
    c.save();
    c.strokeStyle = order.done ? "#a8c1a680" : "#f2d08bcc";
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(x, y, 21, 0, TAU);
    c.lineWidth = 1.4;
    c.stroke();
    c.restore();
    local(c, x, y, -.18, () => {
      poly(c, [
        [-14, -8],
        [13, -8],
        [15, 5],
        [12, 9],
        [-13, 9]
      ], "#4f5044", "#272e2b", 1.5);
      for (let i = 0; i < 6; i++) line(c, [
        [-6 + i * 2, -7],
        [-4 + i * 2, 6]
      ], "#d7c596", 1.8);
      post(c, -10, 0);
      post(c, 11, 0);
      line(c, [
        [9, -3],
        [15, -8],
        [18, -7]
      ], "#dfd6bb", 2.2);
    });
    if (close && !order.done && order.label) {
      c.font = "600 13px system-ui";
      c.textAlign = "center";
      const width = Math.min(320, c.measureText(order.label).width + 20),
        cx = Math.max(width / 2 + 4, Math.min(W - width / 2 - 4, x));
      c.fillStyle = "#20302ce8";
      c.fillRect(cx - width / 2, y - 45, width, 20);
      c.fillStyle = "#f3e4bf";
      c.fillText(order.label, cx, y - 31, width - 8);
    }
  }

  function effect(c, f, reduced) {
    const a = f.ttl / f.life,
      v = 1 - a;
    c.save();
    c.globalAlpha = reduced ? Math.min(.78, a + .14) : Math.min(1, a + .27);
    if (f.type === "impact") footprint(c, f.shape, "#f1c19745", "#f8cf93", 2);
    else if (f.type === "number") {
      c.textAlign = "center";
      c.font = (f.heavy ? "bold 16" : "600 12") + "px system-ui";
      const y = f.y - (reduced ? 0 : v * 16);
      c.lineWidth = 3;
      c.strokeStyle = "#26312e";
      c.strokeText(String(f.value), f.x, y);
      c.fillStyle = f.heavy ? "#ffe4a4" : "#e8e8d3";
      c.fillText(String(f.value), f.x, y);
    } else if (["cast", "return", "shear", "snap"].includes(f.type)) {
      const pts = [
          [f.x, f.y],
          [f.endX, f.endY]
        ],
        heavy = f.type !== "cast";
      if (f.type === "snap") {
        line(c, pts, "#f3ca852a", 2 * f.whipWidth);
      }
      line(c, pts, "#2e3c3bd9", heavy ? 6 : 3);
      line(c, pts, f.type === "return" ? "#c2f2de" : heavy ? "#ffe2a2" : "#ebd9ae", heavy ? 3.2 : 1.5);
    } else if (f.type === "arc" || f.type === "shearFan") {
      const sweep = f.type === "arc" ? .93 : f.sweep,
        rad = f.radius * (reduced ? .85 : .68 + .32 * v);
      c.beginPath();
      c.moveTo(f.x, f.y);
      c.arc(f.x, f.y, rad, f.angle - sweep, f.angle + sweep);
      c.closePath();
      c.fillStyle = f.type === "arc" ? "#f4d79b21" : "#e8d49a47";
      c.fill();
      c.beginPath();
      c.arc(f.x, f.y, rad, f.angle - sweep, f.angle + sweep);
      c.strokeStyle = "#edd6a4";
      c.lineWidth = f.type === "arc" ? 1.8 : 3;
      c.stroke();
    } else if (f.type === "evade") {
      for (let i = -1; i <= 1; i++) local(c, f.x, f.y, f.angle, () => line(c, [
        [-8, i * 5],
        [10 + v * 21, i * 5]
      ], "#cfddc5", 1.6));
    } else {
      const r = f.radius * (reduced ? .85 : .42 + .58 * v);
      c.beginPath();
      c.arc(f.x, f.y, r, 0, TAU);
      c.strokeStyle = f.type === "sounding" ? "#ccdfc6" : "#f0d7a0";
      c.lineWidth = f.type === "guard" ? 3 : 1.4;
      c.stroke();
      if (f.type === "break")
        for (let i = 0; i < 6; i++) local(c, f.x, f.y, i * TAU / 6, () => line(c, [
          [r * .67, 0],
          [r * .91, 1]
        ], "#ead9a5", 2));
    }
    c.restore();
  }

  function loosePart(ctx, part, reducedMotion, time) {
    const { x, y, label } = part;
    const rise = reducedMotion ? 0 : Math.sin(3 * time + x) * 1.5;
    oval(ctx, x, y + 6, 8, 3, "#1c302c66");
    poly(ctx, [[x - 6, y + rise], [x, y - 6 + rise], [x + 6, y + rise], [x, y + 6 + rise]],
      "#e5bc6c", "#4c4938", 1.7);
    line(ctx, [[x, y - 12 + rise], [x, y - 7 + rise]], "#fae9ba", 1.5);
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "600 11px system-ui";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#253b36";
    const tx = Math.max(44, Math.min(W - 44, x));
    ctx.strokeText(label, tx, y + 18);
    ctx.fillStyle = "#f0db9f";
    ctx.fillText(label, tx, y + 18);
    ctx.restore();
  }

  function draw(canvas, s, { reducedMotion = false } = {}) {
    if (!canvas || !s) return;
    const width = Math.max(1, Math.round((canvas.clientWidth || W) * Math.min(root.devicePixelRatio || 1, 2)));
    const height = Math.round(width * H / W);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const c = canvas.getContext("2d");
    c.setTransform(width / W, 0, 0, height / H, 0, 0);
    c.lineJoin = "round";
    c.lineCap = "round";
    c.drawImage(terrain(canvas, s), 0, 0, W, H);
    work(c, s);
    for (const piece of s.pickups) loosePart(c, piece, reducedMotion, s.elapsed);
    classGeometry(c, s);
    if (s.reinforcement && s.reinforcement.timer !== null) {
      const r = s.reinforcement;
      for (let i = 0; i < r.roster.length; i++) {
        const x = r.x + (i - 1) * 36,
          y = r.y + 20 * (i % 2);
        c.save();
        c.setLineDash([4, 5]);
        c.beginPath();
        c.ellipse(x, y, 15, 10, 0, 0, TAU);
        c.strokeStyle = "#eee0af";
        c.lineWidth = 1.7;
        c.stroke();
        c.restore();
      }
    }
    for (const hazard of s.hazards) {
      tell(c, hazard.shape, 1 - hazard.timer / hazard.duration);
    }
    for (const enemy of s.enemies) {
      if (enemy.mode !== "windup") continue;
      const progress = 1 - enemy.timer / enemy.duration;
      for (const shape of enemy.shapes) tell(c, shape, progress);
    }
    for (const fx of s.effects) {
      if (fx.type === "impact") effect(c, fx, reducedMotion);
    }
    const units = [...s.enemies, s.player].sort((a, b) => a.y - b.y);
    for (const unit of units) {
      if (unit === s.player) worker(c, s, s.elapsed, reducedMotion);
      else actor(c, unit, s.elapsed, reducedMotion, s.modifiers.includes("armored"));
    }
    for (const fx of s.effects) {
      if (fx.type !== "impact") effect(c, fx, reducedMotion);
    }
  }
  root.SoundArena = {
    draw
  };
})(globalThis);
