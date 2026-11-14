/* Market Steps. One turn is a movement or a piece of work during the ebb.
   Reading, looking at the chart and handling papers never spend a turn. */
(() => {
  "use strict";

  const places = ["Skiff", "Broken rail", "Baker’s sill", "Fishwives’ gutter", "Market Steps", "Survey cut"];
  const links = [[1], [0, 2, 3], [1, 4], [1, 4], [2, 3, 5], [4]];
  const hazard = (a, b) => a === 3 || b === 3;
  const berth = state => state.moored === "sill" ? 1 : 3;
  const choice = (id, label) => ({ id, label });

  function start() {
    return {
      phase: "approach", position: 0, ada: 0, moored: null, pulse: 0,
      secured: false, quiet: false, marked: false, tally: false, exit: false,
      memory: { sill: false, gutter: false }, receipt: false, witnessed: false,
      text: "Ada sits in the stern with the pilot, sighting over her shoulder. You came south from Orren to find the brass half a ferry crew left at Sere forty-one years ago. The ebb after the second high has brought a few courses of the old market out of the Sound. Ada touches the pilot’s wrist. “Let her slide. There was a railing here.”"
    };
  }

  function neighbors(s) {
    if (s.exit || (s.position === 1 && !s.moored)) return [];
    return links[s.position].filter(to => {
      if (s.position === 0) return to === 1;
      if (to === 0) return false; // The pilot has taken the boat round the market.
      if (s.phase === "return" && ((s.position === 2 && to === 1) || (s.position === 1 && to === 2))) return false;
      if (to === 4 && !s.secured) return false;
      return true;
    });
  }

  const slips = [
    { name: "Freight shed counterfoil", lines: ["Passage 71 · Sere ferry", "E. Velt orders this ferry to the freight berth.", "Eleven slings of rye landed · shore porter’s mark"] },
    { name: "Chandler’s bill", lines: ["Hull 71 · Passage 17", "Lamp oil and two wick ends.", "Paid from the pilot’s purse"] },
    { name: "Sailing desk copy", lines: ["Passage 71 · Sere ferry", "Seats reserved for the return to Market Steps.", "Space to enter the landing left empty"] }
  ];

  function choices(s) {
    if (s.phase === "done") return [choice("restart", "Make another crossing")];
    if (s.phase === "relief") return [choice("spell", "Take Kit’s place on the carrying line"), choice("pass", "Leave the roll with Kit and Ada")];
    if (s.phase === "verran") {
      if (!s.receipt) return slips.map((slip, i) => choice("slip" + i, "Lay down the " + slip.name.toLowerCase()));
      return [choice("order1", "Put the passenger return before the second stroke"),
        choice("order2", "Put the second stroke before the passenger return")];
    }
    const opts = [];
    if (s.position === 1 && !s.moored) {
      return [choice("moorSill", "Send the skiff to the baker’s sill"), choice("moorGutter", "Send her to the fishwives’ gutter")];
    }
    if (s.position === 2 && s.ada === 2 && !s.memory.sill) opts.push(choice("lookSill", "Put a thumb in the groove in the sill"));
    if (s.position === 3 && s.ada === 3 && !s.memory.gutter) opts.push(choice("lookGutter", "Call into the gutter"));
    if (!s.secured && s.position === 2) opts.push(choice("guide", "Carry the line back to Ada"));
    if (s.position === 3 && !s.quiet) opts.push(choice("unseat", "Lift the loose gutter stone"));
    if (!s.secured && s.position === 3 && s.quiet) opts.push(choice("guide", "Bring Ada through the gutter"));
    if (s.position === 5 && !s.marked) opts.push(choice("rub", "Hold the sheet against the survey cut"));
    if (s.position === 4 && s.marked && !s.tally) opts.push(choice("take", "Ease the brass out of its socket"));
    if (s.phase === "return" && s.position === berth(s)) opts.push(choice("leave", "Give the pilot your hand"));
    const destinations = neighbors(s);
    for (const to of destinations) {
      const label = to === 1 && s.position === 0 ? "Step out at the broken rail" : "Go to " + places[to].toLowerCase();
      opts.push(choice("go" + to, label));
    }
    if (!s.quiet && (s.position === 3 || destinations.includes(3))) opts.push(choice("wait", "Let one wash pass"));
    return opts;
  }

  function arrival(s) {
    switch (s.position) {
      case 1: {
        if (!s.moored) return "Ada reaches for a length of iron that has gone. The pilot points her oar at the baker’s sill. “Put me up there and I can reeve your handline. If the lip goes I’ll have to come back here.” At the gutter she can keep a berth right below the steps, but you’ll have to get Ada across the gap yourself.";
        if (s.phase === "return") return s.moored === "sill"
          ? "The skiff is back under the last post. Ada puts a knee on the thwart while you steady it. There is room to board here." : "From the last post you can see your skiff below the gutter. Ada turns back with you. The ledge above has gone.";
        return s.secured ? "Ada sets her foot beside yours at the rail. The upper sill and the gutter both run east to the Market Steps." : "The skiff has gone round to the gutter. Ada waits at the post. You can run her line around the staple on the high sill or clear the gutter below.";
      }
      case 2: return s.phase === "return"
        ? "Open water cuts the oven off from the broken rail. The way to the skiff goes by the Market Steps and down the gutter. Ada presses a palm to the grit on the oven floor before she turns."
        : "A groove at thumb height runs the length of the baker’s sill. An iron staple still holds fast at the far end of the missing rail. " + (s.secured ? "Ada rests her hand on the staple beside yours. The old market steps are round the back of the oven." : "Get the line round the staple and take its end back to Ada. Fine white stems lift and settle far below in the gutter.");
      case 3: return s.quiet
        ? "Water runs dark through the break you made in the chalk. At the bend, the fish sellers used to tip their boards against the wall to drain. Past them the gutter opens onto the Market Steps."
        : "Each wash flexes a loose gutter stone. A colony rooted across the joint raises a hard white comb. On slack water you can lift the stone off its bed and break the connection. Or watch the comb and cross before it stands.";
      case 4: return s.tally ? "The empty tally socket has bright brass dust around its lip. Ada checks where the pilot has got to."
        : s.marked ? "Ada sets one finger on the notch you marked. Under it the brass is still wedged crosswise. It will come free if you tip the rounded end first."
        : "There are three sockets under the step. Ada puts her hand over yours before you pull. “If I just bring them a bit of brass, they’ll ask where I bought it.” A survey cut on the high end of the step gives her a fixed point for the rubbing.";
      case 5: return "The old survey cross stands clear above the water. From here Ada can draw a line back to the third berth and mark the tally in place. Salt has filled the downstroke of the cross. It grits under your paper.";
      default: return "";
    }
  }

  function act(s, id) {
    if (!choices(s).some(option => option.id === id)) return false;
    const nextWash = () => { s.pulse = (s.pulse + 1) % 3; };
    if (id === "restart") { Object.assign(s, start()); return true; }
    if (id.startsWith("go")) {
      const to = Number(id.slice(2));
      if (hazard(s.position, to) && s.pulse === 2 && !s.quiet) {
        s.text = "The crown comes up under the lip. You pull your boot back onto the same stone. The wash breaks. The gutter lies flat again.";
        nextWash();
        return true;
      }
      s.position = to;
      if (s.secured || to === 1) s.ada = to;
      s.text = arrival(s);
      nextWash();
      return true;
    }
    if (id === "moorSill" || id === "moorGutter") {
      s.moored = id === "moorSill" ? "sill" : "gutter";
      s.secured = s.moored === "sill";
      if (s.secured) {
        s.position = 2;
        s.ada = 2;
      }
      s.text = s.secured
        ? "A coil of rope comes over the side. The pilot pulls it through the staple by the oven, giving Ada a handline across the gap. You go first. The rope comes taut behind you and Ada steps up onto the sill beside the oven. A piece of its lip falls against the boat. The pilot keeps an oar out to push off."
        : "The pilot fits the bow into a notch below the gutter. You can walk the brass straight aboard there, if you can get past the chalk on the return.";
    } else if (id === "wait") {
      nextWash();
      s.text = ["Foam takes the grit out with it. The loose stone rests flat. There is time to lift it from the gutter.", "A fan of pale threads rises on the seam. One crossing is still clear before the crown stands.", "The whole ridge stands on edge across the gutter. Hold your footing for this wash."][s.pulse];
    } else if (id === "lookSill") {
      s.memory.sill = true;
      s.text = "Your thumb comes away black. “Burnt sugar,” Ada says. Then she laughs at herself. “Mud, now.” Children used to run a spoon along here after the hot trays went out. Kit lived behind the oven. “I let her have the clean end,” Ada says. “Very big of me.”";
    } else if (id === "lookGutter") {
      s.memory.gutter = true;
      s.text = "You call, and your own voice comes back from below the steps. Ada leans over. “Skin on?” Then she drops her voice half an octave. “Both sides!” It comes up from under your boots in a fine deep bass. “Kit’s mam sold fish. She’d clip us round the ear if she could get at us down there.”";
    } else if (id === "unseat") {
      if (s.pulse === 0) {
        s.quiet = true;
        s.text = "You take the loose stone by both ends. It turns over with a sound like a saucer breaking. One half of the chalk stays on the bed, the other on its underside. The next wash goes through the gap without raising a crown.";
      } else {
        s.text = "The joint takes weight as you put your hand to it. You let go before it closes. The stone will turn when the wash goes slack.";
      }
      nextWash();
    } else if (id === "guide") {
      s.secured = true; s.ada = s.position;
      s.text = s.position === 2
        ? "The line takes Ada’s weight where the rail gives out. Halfway across she kicks off one loose shoe. You fish it out below the staple. She tips a live shrimp out of the toe and ties the shoe tighter."
        : "Ada comes through the quiet gutter on your shoulder. At the turn she ducks under an imaginary awning. “Every blessed morning I cracked my head on that thing.”";
      nextWash();
    } else if (id === "rub") {
      s.marked = true;
      s.text = "You hold the paper against the survey cross. Ada rubs it through, then sights along the tread and sketches the third socket with the brass still in it. She tucks the sheet into her oilskin and leads you back towards the steps.";
    } else if (id === "take") {
      s.tally = true; s.phase = "return";
      s.text = "The brass comes up warm where your fingers have been working it. Passage 71. The other cut edge should have come home on the boat. Ada copies the number and folds your fingers over the shore half. Behind you a section of ledge slides off the broken rail. " + (s.moored === "sill" ? "The pilot shoves off the falling lip and drops back to the broken rail. To reach her you’ll have to take Ada down the gutter and round to the post." : "The pilot holds her berth below the gutter. You can still reach her bow from the steps.");
    } else if (id === "leave") {
      s.phase = "verran"; s.exit = true;
      s.text = (s.moored === "sill"
        ? "At the broken post Ada steps onto the thwart. She makes the pilot lie off a moment. The last corner of the oven goes under. Then she takes up an oar."
        : "You keep the brass hand high as Ada steps over the bow. The skiff backs out through the gutter. " + (s.memory.gutter ? "“Skin on,” she says once more, too softly for the pilot to hear." : "Ada waits until the last corner of the oven goes under before she takes up an oar."))
        + " Back through Orren, then north to Verran on the third high. A freight clerk brings out three winter slips. Find what the ferry actually carried.";
    } else if (id.startsWith("slip")) {
      if (id === "slip0") {
        s.receipt = true;
        s.text = "The porter counted eleven slings of rye off passage 71. Ada sets the receipt beside the brass. “So that’s where she went.” She opens the sheet of people still at the steps. The Board chair sits opposite her. Iven, the surveyor, brings his order for the second stroke. Had Eran already seen who was waiting when he signed it?";
      } else {
        s.text = id === "slip1" ? "The clerk puts his nail under Hull. A hull keeps its number across a hundred trips. The shore brass numbers the passage. Try the papers again."
          : "Ada keeps her hand on the sailing desk copy. “There’s our booking. Now show me who saw her unload.” Find a landing somebody witnessed.";
      }
    } else if (id === "order2") {
      s.text = "Ada taps the receipt bell beside the waiting names. Third bell. Iven reads the work bell aloud. Fourth. “He’d had our names a whole bell by then.” You can put the papers in that order.";
    } else if (id === "order1") {
      s.phase = "relief";
      const recognition = s.memory.gutter
        ? "Ada calls “Skin on?” Kit turns with a sack riding her hip. “Oh, for pity’s sake, Ada. My mam could hear you from her bed.”"
        : s.memory.sill ? "Ada holds her thumb out like a sticky spoon. Kit laughs. “You used to give me the clean end and tell me I was lucky.”" : "Ada picks out a woman tying up her sleeve on the sack line. “That’s Kit. Her mam rented the room behind our oven.”";
      s.text = "Eran looks at his initials. Ada asks who took word to the people at the steps. He cannot name anybody. Later the crews publish the orders and Bela stops the powered hoist. On the fourth high, you find Ada on the hand-unloading stair. " + recognition + " Kit wants the room her family rented entered in her own name. There’s space opposite Ada’s family deed. The steward who knew them on Sere is just going on break.";
    } else if (id === "spell") {
      s.phase = "done";
      s.witnessed = true;
      s.text = "You take Kit’s end of the next sack. She overtakes the steward two steps up. He starts to write her mother’s name. “I can do that part,” she says. She writes it as it was on Sere and adds the surname Verran put on her first pay packet. He witnesses both. Ada blows the grit off the facing page. When Kit comes back you’ve got the sack up as far as your knee. She shows you how to turn under it.";
    } else if (id === "pass") {
      s.phase = "done";
      s.text = "Kit props the book on the top sack and writes her mother’s name opposite Ada’s family deed. She adds the surname on her Verran pay packet. The steward’s break ends before he comes down the stair. His witness space stays open. Kit slips a scrap of sacking in to mark the place. Ada goes back up the queue with her, carrying one end this time.";
    }
    return true;
  }
  window.MarketSteps = { start, act, choices, neighbors, places, slips };
})();
