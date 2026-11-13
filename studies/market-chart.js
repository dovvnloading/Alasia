/* An ebb survey of the Market Steps. Coordinates are shared with the scene. */
(() => {
  "use strict";

  const WIDTH = 800;
  const HEIGHT = 440;
  const SCALE = 2;
  const sites = [[120, 320], [295, 242], [352, 106], [474, 327], [622, 188], [705, 116]];
  const routes = [
    { sites: [0, 1], points: [[151, 305], [208, 280], [251, 259], sites[1]], width: 20 },
    { sites: [1, 2], points: [sites[1], [303, 204], [328, 156], sites[2]], width: 17 },
    { sites: [1, 3], points: [sites[1], [354, 265], [408, 300], sites[3]], width: 26 },
    { sites: [2, 4], points: [sites[2], [406, 106], [478, 129], [550, 146], sites[4]], width: 22 },
    { sites: [3, 4], points: [sites[3], [506, 303], [549, 265], [580, 232], sites[4]], width: 27 },
    { sites: [4, 5], points: [sites[4], [659, 163], [681, 140], sites[5]], width: 24 }
  ];
  const labelPositions = [
    [86, 373, "Approach"], [239, 217, "Broken rail"], [339, 52, "Baker’s sill"],
    [451, 383, "Fishwives’ gutter"], [666, 238, "Market Steps"], [730, 73, "Survey cut"]
  ];

  const stoneLight = ["#c5be98", "#c1b590", "#b0af90", "#d2c5a4", "#b4b495", "#c9c09c"];
  const stoneWet = ["#82978a", "#94a492", "#a6b09a", "#a4a992", "#89a197", "#aab299"];
  const ink = "#293f3b";
  const baseLayers = new Map();

  function randomSource(seed) {
    let word = seed >>> 0;
    return () => {
      word = (Math.imul(1664525, word) + 1013904223) >>> 0;
      return word / 4294967296;
    };
  }

  function choose(random, values) {
    return values[Math.floor(random() * values.length)];
  }

  function path(ctx, points, closed = false) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    if (closed) ctx.closePath();
  }

  function line(ctx, points, color, weight = 1) {
    path(ctx, points);
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.stroke();
  }

  function polygon(ctx, points, fill, stroke, weight = 1) {
    path(ctx, points, true);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight;
      ctx.stroke();
    }
  }

  function oval(ctx, x, y, rx, ry, fill, rotation = 0, stroke, weight = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight;
      ctx.stroke();
    }
  }

  function water(ctx) {
    const wash = ctx.createLinearGradient(0, 0, WIDTH * 0.9, HEIGHT);
    wash.addColorStop(0, "#183e45");
    wash.addColorStop(0.42, "#305954");
    wash.addColorStop(0.74, "#416d64");
    wash.addColorStop(1, "#214f51");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const random = randomSource(909);
    // Water turns round the masonry head. Short white strokes run with its grain.
    for (let i = 0; i < 3200; i++) {
      const x = random() * 836 - 18;
      const y = random() * 470 - 15;
      const heading = -0.26 + 0.25 * Math.sin(x / 130 + y / 115);
      const length = 1 + random() ** 3 * 18;
      const color = choose(random, ["#e0dcb519", "#a8d8c321", "#a8d8c316", "#071e2a38"]);
      line(ctx, [[x, y], [x + length * 0.6, y + heading * length * 0.7],
        [x + length, y + heading * length + 0.3]], color, 0.4 + random() * 0.8);
    }
    // Depth contours wrap the sunken street. The widely spaced outer lines lie deeper.
    for (let i = 0; i < 7; i++) {
      const spread = i * (6 + i * 0.7);
      const p = new Path2D();
      p.moveTo(-45, 285 + spread * 1.8);
      p.bezierCurveTo(135, 242 + spread, 186 - spread * 0.5, 216 - spread, 246 - spread * 0.5, 191 - spread);
      p.bezierCurveTo(282 - spread, 161 - spread * 0.1, 251 - spread * 0.8, 74 - spread * 0.6, 341 - spread, 46 - spread);
      p.bezierCurveTo(452, 18 - spread, 540, 104 - spread, 602, 108 - spread);
      p.bezierCurveTo(686, 111 - spread, 667, 46 - spread, 854, 2 - spread);
      ctx.strokeStyle = i === 0 ? "#a3c8ad41" : "#9abfa730";
      ctx.lineWidth = i === 0 ? 1.2 : 0.65;
      ctx.stroke(p);
      const q = new Path2D();
      q.moveTo(-25, 388 + spread);
      q.bezierCurveTo(94, 401 + spread, 199, 297 + spread, 266, 290 + spread * 0.6);
      q.bezierCurveTo(327, 287 + spread * 0.6, 420, 382 + spread * 0.7, 497, 356 + spread);
      q.bezierCurveTo(571 + spread * 0.3, 332 + spread, 611 + spread * 0.6, 248 + spread, 667 + spread * 0.7, 218 + spread);
      q.bezierCurveTo(748 + spread * 0.4, 172 + spread, 759 + spread * 0.8, 159 + spread, 836, 145 + spread);
      ctx.stroke(q);
    }
  }

  function kelp(ctx, random, x, y, size) {
    const shades = ["#536e54", "#6f7956", "#394f48", "#8b8c61"];
    const stalks = 4 + Math.floor(random() * 3);
    for (let i = 0; i < stalks; i++) {
      const dx = -(4 + random() * 19) * size;
      const dy = (random() - 0.2) * 16 * size;
      const points = [];
      for (let j = 0; j <= 8; j++) {
        const t = j / 8;
        const px = x + dx * t;
        const py = y + dy * t + Math.sin(t * 6 + i) * 1.6;
        points.push([px, py]);
        if (j > 0 && j % 2 === 0) {
          const angle = j % 4 ? -0.7 : 0.6;
          oval(ctx, px - 1, py + angle, 2.7 * size, 0.85 * size, choose(random, shades), angle);
        }
      }
      line(ctx, points, "#283f39", 0.8 * size);
    }
  }

  function submergedMarket(ctx) {
    const random = randomSource(771);
    // Cellars converge on the old market street. Gaps in their walls face the shops' thresholds.
    ctx.save();
    ctx.translate(387, 172);
    ctx.rotate(0.30);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < (row === 0 ? 4 : 3); col++) {
        const x = col * 43 - row * 2;
        const y = row * 39;
        const w = 37 + random() * 3;
        const h = 26;
        polygon(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], "#35574f");
        const edges = [[[x + 12, y], [x, y], [x, y + h], [x + w, y + h], [x + w, y], [x + 24, y]]];
        for (const edge of edges) {
          line(ctx, edge, "#24463f", 5.5);
          line(ctx, edge, "#748b75", 2.7);
          line(ctx, edge.map(([a, b]) => [a, b - 0.75]), "#91a18a", 0.6);
        }
        for (let j = 0; j <= 3; j++) {
          const px = x + j * 9;
          line(ctx, [[px, y + h - 1], [px + 0.4, y + h + 1.5]], "#3e5f55", 1.2);
        }
        for (let k = 0; k < 5; k++) {
          const px = x + 2 + random() * w;
          const py = y + 4 + random() * (h - 5);
          line(ctx, [[px, py], [px + 5 + random() * 6, py - 0.7]], "#a0b79d3d", 0.8);
        }
      }
    }
    ctx.restore();
    for (const [x, y, size] of [[213, 271, .75], [235, 285, .8], [277, 267, .7],
      [339, 197, .75], [414, 245, .9], [484, 254, .85], [512, 311, 1],
      [542, 275, .8], [561, 282, .85], [635, 209, 1.2], [676, 173, .8],
      [286, 154, 1.05], [356, 136, .7], [534, 123, .9], [418, 69, .8]]) {
      kelp(ctx, random, x, y, size);
    }
    // A few broken coping stones continue the old alignment below ordinary water.
    for (const [x, y, angle] of [[313, 178, -1.13], [271, 301, .5], [649, 242, -.78],
      [522, 293, -.77], [447, 98, .28], [367, 148, -.9], [229, 250, -.4], [692, 177, -.75]]) {
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(x + i * 6 * Math.cos(angle), y + i * 6 * Math.sin(angle));
        ctx.rotate(angle + random() * .4);
        polygon(ctx, [[-3, -2], [4, -3], [3, 2], [-2, 3]], choose(random, ["#648274", "#627b6c", "#84947b"]), "#3c5a52", .6);
        ctx.restore();
      }
    }
  }

  function drownedCourts(ctx) {
    const random = randomSource(177);
    // Paving survives under a skin of shallow water inside the block. Beyond it the water darkens.
    const shoal = [[272, 234], [305, 174], [323, 105], [365, 86], [431, 101],
      [536, 135], [610, 163], [638, 170], [633, 208], [556, 273], [478, 335], [381, 292]];
    ctx.save();
    path(ctx, shoal, true);
    ctx.clip();
    const shallow = ctx.createLinearGradient(300, 90, 519, 330);
    shallow.addColorStop(0, "#7a96863d");
    shallow.addColorStop(.44, "#6f96835c");
    shallow.addColorStop(1, "#83a18b25");
    ctx.fillStyle = shallow;
    ctx.fillRect(250, 70, 415, 290);
    for (let i = 0; i < 650; i++) {
      const x = 260 + random() * 390, y = 75 + random() * 275;
      line(ctx, [[x, y], [x + 1.5 + random() * 4, y - .5]],
        choose(random, ["#c9c5a133", "#25463e39", "#9ba78a39"]), .8);
    }
    ctx.restore();
    // Slabs one course below the surviving streets are irregular and discontinuous.
    const courts = [
      { p: [[292, 233], [323, 171], [335, 155], [343, 158], [339, 178], [344, 179], [332, 205], [319, 232], [329, 244], [318, 249]], a: -.99 },
      { p: [[383, 114], [420, 114], [456, 126], [457, 145], [451, 156], [430, 149], [428, 153], [404, 145], [402, 139], [384, 135]], a: .28 },
      { p: [[514, 139], [559, 147], [589, 167], [584, 175], [574, 181], [553, 173], [551, 177], [533, 171], [535, 163], [507, 154]], a: .30 },
      { p: [[304, 245], [380, 268], [410, 292], [401, 296], [374, 279], [352, 279], [345, 273], [330, 273], [315, 262]], a: .43 },
      { p: [[450, 304], [468, 293], [486, 291], [491, 279], [512, 267], [519, 260], [541, 254], [554, 247], [562, 254], [479, 325]], a: -.69 },
      { p: [[604, 206], [633, 175], [652, 161], [667, 157], [652, 178], [650, 184], [632, 200], [636, 204], [614, 219]], a: -.83 }
    ];
    for (const court of courts) {
      polygon(ctx, court.p.map(([x, y]) => [x + 1, y + 2]), "#2d4c42");
      polygon(ctx, court.p, choose(random, ["#788f7e", "#71897c", "#889682"]), "#4c675b", .9);
      ctx.save();
      path(ctx, court.p, true);
      ctx.clip();
      const x0 = Math.min(...court.p.map(p => p[0])), y0 = Math.min(...court.p.map(p => p[1]));
      ctx.translate(x0, y0);
      ctx.rotate(court.a);
      for (let row = -10; row < 23; row++) {
        const y = row * 5.2;
        line(ctx, [[-100, y], [220, y + .8]], "#47695b", .8);
        let x = -100 + random() * 8;
        while (x < 220) {
          x += 7 + random() * 10;
          line(ctx, [[x, y + .4], [x + .5, y + 5.1]], "#536f61", .7);
          line(ctx, [[x + 2, y + 1], [x + 5 + random() * 3, y + 1.3]], "#b2bb9f75", .65);
        }
      }
      ctx.restore();
    }
  }

  function masonryRun(ctx, from, to, width, dry, seed) {
    const [x, y] = from;
    const dx = to[0] - x;
    const dy = to[1] - y;
    const len = Math.hypot(dx, dy);
    const random = randomSource(seed);
    const w = width / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dy, dx));
    polygon(ctx, [[-1, -w], [len + 1, -w], [len + 1, w], [-1, w]], ink);
    for (let row = 0; row < 2; row++) {
      let xx = -0.75;
      const top = -w + row * w;
      while (xx < len) {
        const tail = Math.min(len + 1, xx + 6 + random() * 10);
        if (tail - xx > 1.8) {
          const y1 = top + .3 + random() * .65;
          const y2 = top + w - .35 - random() * .65;
          polygon(ctx, [[xx + .3, y1 + .9], [tail - 1, y1], [tail - .3, y1 + 1.1],
            [tail - .65, y2], [xx + .8, y2], [xx, y2 - 1.4]], choose(random, dry ? stoneLight : stoneWet));
          line(ctx, [[xx + 1, y1 + 1.4], [tail - 1.6, y1 + .7]], dry ? "#e7d8b0aa" : "#c7ccb09c", .65);
          if (tail - xx > 8 && random() > .35) {
            const bx = xx + (tail - xx) * .4;
            line(ctx, [[bx, y2 - .3], [bx + 1.2, y2 - 2.2], [bx + 3, y2 - 2.9]], "#6d715b8f", .6);
          }
        }
        xx = tail;
      }
    }
    ctx.restore();
  }

  function stair(ctx, x, y, angle, width, length) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const random = randomSource(Math.round(x + y));
    for (let d = -length / 2; d < length / 2; d += 4.5) {
      const w = width / 2 + random() * .9;
      polygon(ctx, [[d, -w], [d + 4.1, -w + .3], [d + 4.4, w], [d, w - .3]],
        choose(random, stoneLight), ink, .55);
      line(ctx, [[d + .8, -w + .7], [d + .8, w - .7]], "#e9d7ad", .85);
      line(ctx, [[d + 3.2, -w], [d + 3.3, w]], "#717767", 1);
    }
    ctx.restore();
  }

  function rails(ctx, points) {
    line(ctx, points.map(([x, y]) => [x + 2.4, y + 3]), "#283e347a", 2.2);
    line(ctx, points, "#243b38", 2.8);
    line(ctx, points.map(([x, y]) => [x, y - .6]), "#aaab8b", .65);
    for (const [x, y] of points) {
      line(ctx, [[x, y + 4.2], [x, y - 1]], "#243a35", 2.1);
      oval(ctx, x, y - 1.5, 1.5, 1.2, "#bdc4a4", 0, "#34453b", .45);
    }
  }

  function ledge(ctx, points, fill) {
    polygon(ctx, points.map(([x, y]) => [x + 1.4, y + 3.8]), "#263b32");
    polygon(ctx, points, fill, "#263c34", 1.15);
    line(ctx, [...points, points[0]], "#d3cb9e99", .85);
  }

  function ruins(ctx, fallen) {
    for (const [i, route] of routes.entries()) {
      line(ctx, route.points.map(([x, y]) => [x + 0.5, y + 4]), "#173c37aa", route.width + 3.2);
      for (let j = 1; j < route.points.length; j++) {
        masonryRun(ctx, route.points[j - 1], route.points[j], route.width, i !== 2 && i !== 4, i * 953 + j * 43);
      }
    }

    // The baker's oven is a vault seen from above, with its missing mouth toward the street.
    ctx.save();
    ctx.translate(386, 88);
    ctx.rotate(.12);
    ledge(ctx, [[-20, -15], [17, -16], [24, -9], [22, 10], [17, 12], [-21, 12]], "#838a71");
    ctx.beginPath();
    ctx.arc(0, -1, 13, 0.08 * Math.PI, .92 * Math.PI, true);
    ctx.lineWidth = 5.3;
    ctx.strokeStyle = "#34483c";
    ctx.stroke();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = "#beaa86";
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (1 + i / 7);
      line(ctx, [[Math.cos(a) * 10.9, Math.sin(a) * 10.9 - 1],
        [Math.cos(a) * 15.1, Math.sin(a) * 15.1 - 1]], "#565e4e", .9);
    }
    oval(ctx, 0, 3, 8, 4.6, "#3c4d40");
    line(ctx, [[-9, 10], [-5, 10]], ink, 2);
    line(ctx, [[6, 10], [16, 10]], ink, 2);
    ctx.restore();

    // Landing fan at the quay and a few thick market treads.
    ledge(ctx, [[600, 184], [619, 165], [635, 162], [649, 178], [631, 198], [615, 207]], "#aaac8e");
    stair(ctx, 622, 185, -.80, 33, 30);
    // Two surviving fish tables stand inland of the gutter; dark rebates once held their timber tops.
    for (const [x, y] of [[462, 288], [481, 280]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-.54);
      polygon(ctx, [[-5, -2], [7, -2], [7, 3], [-5, 3]], "#9ba893", "#536c5e", .8);
      line(ctx, [[-3, 0], [5, 0]], "#586e5e", .8);
      ctx.restore();
    }
    stair(ctx, 367, 106, -.02, 23, 12);
    stair(ctx, 472, 323, -.60, 24, 14);
    stair(ctx, 708, 115, -.75, 23, 18);
    rails(ctx, [[159, 295], [181, 285], [203, 275], [225, 264], [247, 254]]);
    rails(ctx, [[255, 250], [268, 244], [277, 240], [280, 243]]);
    rails(ctx, [[290, 235], [294, 228]]);
    rails(ctx, [[556, 251], [568, 238], [582, 222]]);
    rails(ctx, [[641, 160], [660, 146], [676, 130]]);
    line(ctx, [[713, 103], [716, 106], [725, 98]], "#2d4842", 5);
    line(ctx, [[713, 102.3], [716, 105], [725, 97]], "#e2d8b6", 1.25);

    if (fallen) {
      // A missing section is wider than the player. Jagged ends and floating stone show its former bearing.
      const hole = [[308, 183], [312, 181], [318, 177], [321, 178], [324, 175],
        [335, 178], [324, 200], [321, 202], [318, 200], [315, 204], [309, 199], [303, 200]];
      polygon(ctx, hole, "#365d54");
      line(ctx, [[305, 199], [310, 198], [316, 202], [320, 199], [324, 201]], "#e1c99c", 1.8);
      line(ctx, [[314, 180], [318, 177], [322, 179], [325, 175], [335, 178]], "#d7bd8f", 1.5);
      for (const [xx, yy] of [[305, 193], [313, 187], [307, 181], [323, 190]]) {
        polygon(ctx, [[xx - 3, yy], [xx, yy - 2], [xx + 2, yy], [xx - 1, yy + 2]], "#6b8270", "#415c4e", .5);
      }
    }
  }

  function chalk(ctx, pulse) {
    const random = randomSource(831);
    const shade = ["#c9c5a4", "#e8dbb2", "#f2d4bc"][pulse];
    for (const [x, y, a] of [[351, 263, .5], [400, 291, .55], [446, 316, .39],
      [514, 292, -.7], [562, 249, -.85]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      const sides = pulse + 5;
      line(ctx, [[-9, 3], [-5, 1], [0, 2.5], [5, .3], [10, 1]], "#56675b", 1.9);
      for (let i = 0; i < sides; i++) {
        const bx = -7 + i * 2.35;
        const h = 1.5 + pulse * 2.4 + random() * 1.9;
        const side = i % 2 ? -1 : 1;
        const points = [[bx, 1.8], [bx + 1.2, 1.8 + side * h * .6], [bx + 3.2, 1.5 + side * h]];
        line(ctx, points, "#45594c", pulse === 2 ? 2.6 : 1.45);
        line(ctx, points, shade, pulse === 2 ? 1.3 : .8);
        if (pulse > 0) line(ctx, [points[1], [bx - .5, points[2][1] + side]], shade, .85);
        if (pulse === 2) oval(ctx, bx + 3.2, points[2][1], 1.25, 1.35, "#f4d7bb", 0, "#725e51", .6);
      }
      ctx.restore();
    }
  }

  function boatPosition(moored) {
    if (moored === "sill") return [335, 76, -.24];
    if (moored === "gutter") return [465, 351, -.24];
    if (moored === "rail") return [254, 259, -.44];
    return [120, 320, -.44];
  }

  function boat(ctx, moored) {
    const [x, y, a] = boatPosition(moored);
    if (moored) {
      const [px, py] = moored === "sill" ? sites[2] : moored === "rail" ? sites[1] : sites[3];
      line(ctx, [[x + 12, y + 1], [x + 18, (y + py) / 2], [px - 2, py]], "#1e3932", 2.9);
      line(ctx, [[x + 12, y], [x + 18, (y + py) / 2 - 1], [px - 2, py - 1]], "#c6ac7d", 1.2);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    oval(ctx, 1, 3.7, 32, 10, "#203b35b0");
    const hull = [[-28, -4.9], [-21, -8.4], [-4, -10.3], [12, -9.1], [26, -4],
      [33, .2], [23, 5.5], [10, 9.2], [-5, 9.9], [-19, 7.8], [-28, 4.4]];
    polygon(ctx, hull, "#a1875d", "#1f3532", 2);
    const inner = hull.map(([px, py]) => [px * .91, py * .69]);
    polygon(ctx, inner, "#5e5d46", "#d4b98c", 1);
    for (let i = -2; i <= 2; i++) {
      line(ctx, [[-21, i * 1.7], [0, i * 2.6], [21, i * 1.6]], "#b29a6d", .7);
    }
    for (const bx of [-15, -3, 12]) {
      polygon(ctx, [[bx - 1.5, -6.6], [bx + 1.8, -6.5], [bx + 1.8, 6.7], [bx - 1.5, 6.8]],
        "#cdb28a", "#574f3c", .8);
    }
    line(ctx, [[-20, 9], [20, 5]], "#403c31", 2.3);
    line(ctx, [[-20, 8.3], [20, 4.4]], "#cfc298", .9);
    ctx.restore();
  }

  function person(ctx, x, y, ada) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ada ? .6 : -.5);
    oval(ctx, 1.8, 3.1, 5.8, 4, "#24382dc0", .3);
    polygon(ctx, [[-3, -3], [-4.9, -.3], [-4, 3.7], [-1.5, 3.2], [0, 4.5],
      [3.5, 3.8], [4.3, -.3], [2.8, -3.2]], ada ? "#c4754e" : "#e6d7ae", "#29382e", 1.1);
    line(ctx, [[-3.6, 1.1], [-2.6, 3]], ada ? "#efaf76" : "#f4ebca", 1.1);
    if (ada) line(ctx, [[-2.5, -1], [2, 3]], "#764b35", 1.1);
    oval(ctx, -.3, -1.6, 2.3, 2.7, ada ? "#d2bda1" : "#55584a", 0, "#2b3a31", .9);
    ctx.restore();
  }

  function locationLabels(ctx) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 14px Georgia, 'Liberation Serif', serif";
    for (const [x, y, name] of labelPositions) {
      const w = ctx.measureText(name).width + 13;
      ctx.fillStyle = "#193b39ed";
      ctx.fillRect(x - w / 2, y - 9.2, w, 18.4);
      ctx.fillStyle = "#efe7c7";
      ctx.fillText(name, x, y + .2);
    }
  }

  function markers(ctx, state, mooring) {
    for (const id of state.destinations || []) {
      if (!Number.isInteger(id) || !sites[id] || id === state.position) continue;
      const [x, y] = id === 0 && mooring ? boatPosition(mooring) : sites[id];
      oval(ctx, x, y, 6.4, 6.4, "#405c519c", 0, "#243f38", 2);
      oval(ctx, x, y, 5.1, 5.1, "transparent", 0, "#f2ead0", 1.2);
    }
    const actor = pos => pos === 0 ? boatPosition(mooring) : (sites[pos] || sites[0]);
    const same = state.ada === state.position;
    const [px, py] = actor(state.position);
    const [ax, ay] = actor(state.ada);
    const wx = px + (same ? -3.8 : 0);
    const wy = py + (same ? 1.5 : 0);
    ctx.beginPath();
    ctx.arc(wx, wy, 9.4, 0, Math.PI * 2);
    ctx.strokeStyle = "#273b31";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = "#f5dd95";
    ctx.lineWidth = 1.7;
    ctx.stroke();
    person(ctx, ax + (same ? 5.3 : 0), ay - (same ? 2.5 : 0), true);
    person(ctx, wx, wy, false);
  }

  function prepareBase(fallen) {
    const layer = document.createElement("canvas");
    layer.width = WIDTH * SCALE;
    layer.height = HEIGHT * SCALE;
    const ctx = layer.getContext("2d");
    ctx.scale(SCALE, SCALE);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    water(ctx);
    drownedCourts(ctx);
    submergedMarket(ctx);
    ruins(ctx, fallen);
    baseLayers.set(fallen, layer);
    return layer;
  }

  window.drawMarketChart = function drawMarketChart(canvas, state = {}) {
    const width = WIDTH * SCALE;
    const height = HEIGHT * SCALE;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fallen = state.phase === "return" || Boolean(state.exit);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(baseLayers.get(fallen) || prepareBase(fallen), 0, 0);
    ctx.save();
    ctx.scale(SCALE, SCALE);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!state.quiet) {
      chalk(ctx, [0, 1, 2].includes(state.pulse) ? state.pulse : 0);
    } else {
      // The severed row stays flat in every subsequent wash.
      line(ctx, [[468, 318], [473, 322], [474, 325]], "#365148", 2.2);
      line(ctx, [[478, 327], [482, 330]], "#365148", 2.2);
    }
    const socket = [631, 178];
    oval(ctx, ...socket, 3.6, 2.9, "#394640", -.4, "#d2ceb4", 1);
    if (!state.tally) {
      polygon(ctx, [[626.5, 177], [632, 173.4], [635.4, 178], [630.5, 182]],
        "#e7b45e", "#634e31", 1.1);
      line(ctx, [[628.8, 176], [631.5, 180.1]], "#ffe5a4", 1.1);
    }
    const mooring = fallen && state.moored === "sill" ? "rail" : state.moored;
    boat(ctx, mooring);
    if (!state.exit) {
      markers(ctx, {
        ...state,
        position: Number.isInteger(state.position) ? state.position : 0,
        ada: Number.isInteger(state.ada) ? state.ada : 0
      }, mooring);
    }
    locationLabels(ctx);
    ctx.restore();
  };
})();
