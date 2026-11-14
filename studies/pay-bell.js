(() => {
  "use strict";

  function start() {
    return { room: "cage", coins: 1, tool: null, past: false, stamp: null,
      beat: "lift", price: null, purchase: null, tried: false,
      speech: [] };
  }

  const titles = {
    cage: "The Pay Bell", wheel: "Under the wheel", man: "Pell",
    settlement: "On the scales", street: "Outside the cage", counter: "Night stock",
    trial: "The cellar rail"
  };
  const opening = [
    "Drail puts six silver on the scale. The bell over his head keeps ringing. He has stuffed a twist of blue wool in the cup.",
    "“Six for bringing up the harness collar whole. Pell sold it to me this morning. His sister here took the money.”",
    "The woman in the blue coat sets down her lamp. “He wanted the money sent up while he could still get his hand open. I spent it where he told me.”",
    "Under the wheel a mouth opens in the dark. From where you stand it looks as though the bell cord goes straight down the man’s throat."
  ];

  const services = {
    bar: ["Return bar", "4 silver. Catch a moving carriage at the near rail and hold it through the recoil."],
    shoe: ["Slip shoe", "2 silver. Ride a retreating carriage under a low sill. The fixture has to be moving."]
  };

  function scene(state) {
    const choices = [];
    const offer = (id, label) => choices.push([id, label]);
    const room = state.room;
    let clue = "";
    switch (room) {
      case "cage":
        if (!state.past) offer("old", "Ask the woman what happened to Drail’s last crew");
        if (!state.tool) offer("rent", "Hire the clamp · 1 silver");
        offer("descend", "Take the well stair");
        break;
      case "wheel":
        clue = state.beat === "lift"
          ? "First stroke. The tool bows out over the near rail. One full note."
          : "Return stroke. The tool drags back. The second bell dies against something soft.";
        offer("step", "Cross under the tool arm");
        if (state.tool === "clamp") offer("clamp", "Catch the arm with the hired clamp");
        offer("wait", "Hold on the stair for one stroke");
        offer("withdraw", "Back up to the cage");
        break;
      case "man":
        if (!state.stamp) offer("inspect", "Open the cover inside Pell’s collar");
        if (state.stamp === "seen") {
          offer("spoil", "Break the stamp face before taking the collar");
          offer("whole", "Put the stamp back and take the collar whole");
        }
        break;
      case "settlement":
        if (state.stamp === "whole") {
          offer("sell", "Take the six silver Drail offered");
          offer("extract", "Give Pell his stamp in front of the buyers · take 2 silver");
        } else offer("scrap", "Weigh the spoiled collar · take 2 silver");
        break;
      case "street":
        offer("return", "Go back when Drail opens for the night shift");
        break;
      case "counter":
        if (!state.purchase) {
          for (const [item, [name]] of Object.entries(services)) {
            const cost = item === "bar" ? 4 : 2;
            if (state.coins >= cost) offer(item, "Buy the " + name.toLowerCase() + " · " + cost + " silver");
          }
          offer("decline", "Walk out with your pay");
        } else offer("try", "Take the fitting to the cellar rail");
        break;
      case "trial":
        if (state.purchase && !state.tried) offer("use", state.purchase === "bar" ? "Hold the loaded carriage at the near rail" : "Ride the carriage under the sill");
        offer("again", "Play The Pay Bell again");
        break;
    }
    return { choices, clue };
  }

  function view(s) {
    const { choices, clue } = scene(s);
    const ledger = [["Purse", s.coins + " silver"]];
    if (s.room === "cage" && !s.tool) ledger.push(["For hire", "Ratchet clamp · 1 silver. Sacrificial jaw, good for one loaded arm."]);
    if (s.tool) ledger.push(["Clamp", s.tool === "clamp" ? "Ready." : "Jaw spent."]);
    if (s.price) ledger.push(["Pell’s collar", s.price === 6 ? "Complete, with maker’s stamp · 6 silver paid." : "By weight · 2 silver paid."]);
    if (s.room === "counter") {
      for (const item of Object.values(services)) ledger.push(item);
    }
    if (s.purchase) ledger.push(["Fitted", services[s.purchase][0]]);
    return { title: titles[s.room], scene: s.room === "trial" ? "Verran · Below the counting rooms" : "Verran · Boatbuilder’s wall · Fourth high",
      paragraphs: s.speech.length ? s.speech : opening, clue, ledger, actions: choices };
  }

  function act(s, id) {
    if (!scene(s).choices.some(([key]) => key === id)) return false;
    switch (id) {
      case "old":
        s.past = true;
        s.speech = [
          "“Ten men went down the east well. When the water came over the door, he sold ten belts. A week later they broke through to the air pocket. They brought out a man called Rusk.”",
          "Drail rolls a silver across his knuckles. “Rusk got his belt back.”",
          "“He had to bid for it. You made him put his hand up like everybody else.” She takes off her blue coat and gives you the lamp. “Pell was the one who went back in for him.”"
        ]; break;
      case "rent":
        s.coins--; s.tool = "clamp";
        s.speech = ["Drail fits a soft brass jaw to the clamp and takes your silver. The jaw will fold round the first thing it catches. He has a drawer full of them, each with the shape of a different piece of machinery bitten into it."];
        break;
      case "descend":
        s.room = "wheel"; s.beat = "lift";
        s.speech = ["Below the stair a man is kneeling in a repair harness. The sea lifts the chain wheel against its stop. His harness takes the kick, draws his arm back across his mouth, then lets it out again. His knuckles have worn a clean track on the wall.",
          "The cord that once called the men up for their wages has caught round the head of his tool. On its way back the man takes the cord between his teeth."];
        break;
      case "withdraw":
        s.room = "cage";
        s.speech = ["The woman catches your sleeve before you come off the stair. When she sees you’re alone she moves aside. Drail has left all six pieces on the scale."]; break;
      case "wait":
        s.beat = s.beat === "lift" ? "return" : "lift";
        s.speech = s.beat === "return"
          ? ["Pell takes the cord in his mouth. His tool is going back along the wall. For the length of that strangled note the stair and his shoulder lie on the same side of the iron."]
          : ["The cord slips through his teeth. The arm sweeps out to the rail again. A spray of brick dust lands in the water."];
        break;
      case "step":
        if (s.beat === "lift") {
          s.beat = "return";
          s.speech = ["The iron catches the toe of your boot against the tread. You wrench it loose. The next note comes out muffled. His arm has gone back far enough for you to see a patch of old wall behind it."];
          break;
        }
        s.room = "man";
        s.speech = ["You go in as the second note dies and get your shoulder under his. He leans on you to slip the harness, then kicks it into the well. The next stroke goes clean through the empty jacket. You put the collar on the stair between you.",
          "“Did my sister get up the stair?” Pell spits a piece of bell cord onto his hand. “Ah, good. Get down here with that thing a minute before you give it to him.”"]; break;
      case "clamp":
        s.room = "man"; s.tool = "spent";
        s.speech = ["The jaw folds round the tool arm. Its next stroke drives the clamp into the timber as far as the hinge. Pell comes out of the jacket one wet shoulder at a time. He drags the collar onto the stair.",
          "“Leave the clamp in. He'll charge you for that jaw whatever you do.” He has to swallow twice. “He bought the brass. Open the little lid for me.”"]; break;
      case "inspect":
        s.stamp = "seen";
        s.speech = ["A little steel punch fits under the cover. A gull with three legs is cut into its face. Pell sets it against his thumbnail, presses until the nail goes white, then shows you the bird the right way round.",
          "“Had two legs when I made it. Another fitter had that mark already. I was nineteen and I’d had enough of making birds.”",
          "From above, Drail calls, “Six for the lot. Mind all the little pieces.”",
          "Pell tells you to break the bird’s face. “East well. We got Rusk out and he wanted to shake hands with whoever had tested his belt. Three legs, right across the break. I’d been in bed when they issued those.”"]; break;
      case "whole":
        s.stamp = "whole"; s.room = "settlement";
        s.speech = ["You close the cover over the bird. Pell goes up first, sideways, with one hand on the treads. Drail starts to weigh the collar while Pell still has his fingers on the rim. Pell leaves them there until Drail says good evening.",
          "His first customer is already there with a tray of bare collars. Pell sees him too. He holds his palm open below the lip of the counter."]; break;
      case "spoil":
        s.stamp = "spoiled"; s.room = "settlement";
        s.speech = ["One blow on the edge of the stair takes the beak off. Pell turns the die a quarter turn for the next. When you open your hand he picks out the part with the extra leg and puts it in his cheek like a nail.",
          "At the cage Drail lifts the cover with his little finger. Four of the six coins go back into the drawer. “What do you suppose I wanted it for?”"]; break;
      case "sell":
        s.price = 6; s.coins += 6; s.room = "street"; s.stamp = "sold";
        s.speech = ["Drail pays all six across Pell’s open hand into yours. He picks the punch out of the collar and passes it through the wire to the man with the tray.",
          "On the way out Pell stops at the sound of the first blow. His sister wraps him in her blue coat. Before she finds the second button you hear the punch come down five more times."]; break;
      case "extract":
        s.stamp = "returned"; s.price = 2; s.coins += 2; s.room = "street";
        s.speech = ["You lay the bird in Pell’s hand where the buyers can see it. The man with the tray asks Drail for his deposit back. It takes most of what's in the drawer. Drail weighs the brass and gives you two.",
          "Pell's sister wants to know whether he can work tomorrow. He turns his hand palm down, as if the little punch might fall out of it. His fingers stay where they are."]; break;
      case "scrap":
        s.price = 2; s.coins += 2; s.room = "street";
        s.speech = ["The collar just balances two silver. Drail tips the filings after it and waits for the pan to settle. Pell leans across him, spits the third leg of the bird onto the scales and takes his coat."]; break;
      case "return":
        s.room = "counter";
        if (s.stamp === "sold") s.speech = ["On the night rack every collar wears Pell’s bird. One impression lies half across a crack in the brass. Men in the queue are passing the collars down. Every man wants the one at the top because its stamp is sharpest.",
          "Drail gives you first pick of the stock from the east well. A return bar will hold a moving carriage. A slip shoe rides the carriage under the sill. He names the prices before you take your gloves off."];
        else if (s.stamp === "returned") s.speech = ["A brass plate has appeared on the wall across from Drail. Pell sits underneath it, stamping pieces he has tested. He takes the money in his left hand. The woman in the blue coat works the punch.",
          "Drail has kept the slip shoe you can afford on the bottom shelf. The return bar still carries Rusk’s initials."];
        else s.speech = ["The tray of cheap collars has gone back to the foundry. Pell sits in the cage with Drail, watching him try names from a list of unemployed fitters. When Drail comes to Rusk, Pell reaches through the wire and strikes the name out.",
          "There’s a slip shoe on the lower shelf, the price of the brass you brought up."];
        break;
      case "bar":
      case "shoe":
        s.purchase = id; s.coins -= id === "bar" ? 4 : 2;
        s.speech = id === "bar" ? ["Drail counts out your change and unhooks the return bar. RUSK has been struck into the grip with a blunt nail. You can feel the letters through your glove. A loaded carriage still runs on the short test rail below the counting rooms."]
          : ["Drail takes two and fits the bronze runner to your harness. When you're on it you can get under a sill lower than your own knee. He sends a carriage down the test rail for you."];
        break;
      case "decline":
        s.room = "trial";
        s.speech = ["You keep the silver. At the stair to the counting rooms the pay bell rings once for a sale. Halfway down you hear somebody ring it again."];
        break;
      case "try":
        s.room = "trial";
        s.speech = ["The test carriage runs between a loading rail and a sill scarcely a foot off the flags. Under the sill a landing grate hangs by one ear. At the near rail a porter is waiting to get a sling off the moving bed."];
        break;
      case "use":
        s.tried = true;
        s.speech = s.purchase === "bar"
          ? ["Your bar takes the recoil. For the first time the porter can reach both loops of the sling at once. He gets the load off and slides the empty bed back into its groove. The flooded grate stays out of reach beyond the sill."]
          : ["The slip shoe catches the carriage on its return. You go under the sill on your back and kick the loose grate into its bed. Through the bars you can see the underside of the salvage counter. Drail keeps his own boots on a block above the flags. The loaded sling rolls past the porter again."];
        break;
      case "again":
        Object.assign(s, start()); break;
    }
    return true;
  }

  const model = { start, view, act };
  if (typeof module !== "undefined" && module.exports) module.exports = model;
  if (typeof document === "undefined") return;

  const models = { "pay-bell": model, "pig-door": window.PigDoor };
  const sessions = {};
  const byId = id => document.getElementById(id);
  let current;
  function render(focus) {
    const v = models[current].view(sessions[current]);
    byId("title").textContent = v.title;
    byId("scene").textContent = v.scene;
    byId("place").textContent = current === "pay-bell" ? "Verran" : "Orren";
    const element = (tag, value) => {
      const node = document.createElement(tag);
      node.textContent = value;
      return node;
    };
    byId("narrative").replaceChildren(...v.paragraphs.map(p => element("p", p)));
    byId("evidence").textContent = v.clue;
    byId("status").replaceChildren(...v.ledger.flatMap(([term, value]) => [element("dt", term), element("dd", value)]));
    byId("actions").replaceChildren(...v.actions.map(([id, label]) => {
      const button = element("button", label);
      button.type = "button";
      button.dataset.action = id;
      return button;
    }));
    byId("payPortrait").hidden = current !== "pay-bell";
    byId("pigPortrait").hidden = current !== "pig-door";
    document.title = (current === "pay-bell" ? "The Pay Bell" : "The Pig Door") + " · Alasia";
    for (const link of document.querySelectorAll("[data-encounter]")) {
      if (link.dataset.encounter === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    if (focus) byId("title").focus();
  }
  function route(focus) {
    current = location.hash === "#pig-door" ? "pig-door" : "pay-bell";
    if (!sessions[current]) sessions[current] = models[current].start();
    render(focus);
  }
  byId("actions").addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");
    if (button && button.isConnected && models[current].act(sessions[current], button.dataset.action)) render(true);
  });
  document.querySelector(".skip").addEventListener("click", event => {
    event.preventDefault();
    byId("title").focus();
  });
  window.addEventListener("hashchange", () => route(true));
  route(false);
})();
