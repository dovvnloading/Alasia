(() => {
  "use strict";

  const model = window.MarketSteps;
  const state = model.start();
  const element = name => document.getElementById(name);
  const heading = element("sceneHeading");
  const chart = element("chart");
  const narrow = window.matchMedia("(max-width: 660px)");
  let blockClickUntil = 0;

  function positionActions() {
    const host = element(narrow.matches ? "spread" : "scene");
    const actions = element("actions");
    if (actions.parentElement !== host) host.append(actions);
  }
  narrow.addEventListener("change", positionActions);

  function make(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function actionButton(option) {
    const button = make("button", "", option.label);
    button.type = "button";
    button.dataset.choice = option.id;
    return button;
  }

  function sceneHeading() {
    switch (state.phase) {
      case "quay": return "One more signature";
      case "departure": return "The service copy";
      case "publication": return "One bell for Tessa";
      case "roll": return "The facing page";
      case "terms": return state.netYard ? "At the spur" : state.washhouse ? "The winter net" : "The washroom keys";
      case "setting": return "The sixth high";
      case "verran": return state.receipt ? "The second stroke" : "What the ferry carried";
      case "relief": return "A place in the roll";
      case "done": return state.settlement === "shared" ? "The twelfth high" : "The new measure";
      default: return state.position === 0 ? "Off the Market Steps" : model.places[state.position];
    }
  }

  function watchLabel() {
    if (state.phase === "quay" || state.phase === "departure") return "Orren · Opening watch";
    if (state.phase === "publication") return "Verran · Third high";
    if (state.phase === "setting") return "Selwick · Sixth high";
    if (state.phase === "done") return "Inner Sound · After the setting";
    if (state.phase === "terms" && state.netYard) return "Selwick · Fifth high";
    if (["relief", "roll", "terms"].includes(state.phase)) return "Verran · Fourth high";
    if (state.phase === "verran") return "Verran · Third high";
    return "Sere · Ebb after second high";
  }

  function observation(term, value) {
    element("observations").append(make("dt", "", term), make("dd", "", value));
  }

  function listActions(target, title, options, cssClass) {
    if (!options.length) return;
    const group = make("div", "action-group " + cssClass);
    const label = make("h2", "group-heading", title);
    const list = make("div", "action-list");
    list.append(...options.map(actionButton));
    group.append(label, list);
    target.append(group);
  }

  function drawActions(options) {
    const target = element("actions");
    target.replaceChildren();
    if (state.phase === "verran" && !state.receipt) return; // Each slip is its own choice.
    if (state.phase === "done") {
      const onward = make("a", "expedition-link", "Take Tessa’s workboat · Play Soundings");
      onward.href = "soundings.html?settlement=" + state.settlement + "&bell=" + state.bell;
      target.append(onward, ...options.map(actionButton));
      return;
    }
    if (["quay", "publication", "terms"].includes(state.phase)) {
      const labels = { quay: "At the plank", publication: "At the loading door", terms: "Commit your hands" };
      listActions(target, labels[state.phase], options, "");
      return;
    }
    if (state.phase === "relief" || state.phase === "verran") {
      listActions(target, state.phase === "relief" ? "On the stair" : "Put the papers in order", options, "");
      return;
    }
    if (options.length === 1) {
      const list = make("div", "action-list");
      list.append(actionButton(options[0]));
      target.append(list);
      return;
    }
    const work = options.filter(option => !option.id.startsWith("go") && option.id !== "wait");
    const travel = options.filter(option => option.id.startsWith("go"));
    const wait = options.filter(option => option.id === "wait");
    listActions(target, work.some(option => option.id.startsWith("moor")) ? "Choose a berth" : "At this landing", work, "");
    listActions(target, "Move", travel, "travel");
    listActions(target, "Watch the wash", wait, "travel");
  }

  function drawSea() {
    const neighbors = model.neighbors(state);
    element("companion").setAttribute("aria-label", "Chart and field notes");
    element("chartFigure").hidden = false;
    element("documents").hidden = true;
    chart.setAttribute("aria-label", "Ebb chart of Sere market");
    const visibleCaption = state.phase === "return" ? "Return to the skiff" : "The old ferry approach";
    element("mapCaption").textContent = visibleCaption;
    const retreat = state.phase === "return" && state.moored === "sill";
    let skiff = "Holding off the approach";
    if (retreat) skiff = "Recalled to the broken rail";
    else if (state.moored) skiff = state.moored === "sill" ? "Baker’s sill" : "Fishwives’ gutter";
    const status = state.quiet ? "The loose gutter stone is lifted. The crown lies flat." : [
      "Slack. The loose stone lies flat.",
      "Threads lifting. One crossing is still clear.",
      "Crown up. The gutter crossing is blocked this wash."
    ][state.pulse];
    element("chartDesc").textContent = "You are at " + model.places[state.position] + ". " +
      "Ada is at " + model.places[state.ada] + ". " +
      (neighbors.length ? "Adjacent footing: " + neighbors.map(index => model.places[index]).join(", ") + ". " : "") +
      (state.phase === "return" ? "The ledge between the broken rail and the baker’s sill has fallen. " : "") +
      "Gutter: " + status + " Skiff: " + skiff + ".";
    const notes = element("observations");
    notes.hidden = false;
    notes.replaceChildren();
    observation("Gutter", status);
    observation("Skiff", skiff);
    if (state.ada !== state.position) observation("Ada", "Waiting at " + model.places[state.ada].toLowerCase());
    if (state.marked) observation("Carrying", state.tally ? "Shore brass · Passage 71. Ada keeps the rubbing." : "Ada’s rubbing of the survey cut and socket");
    window.drawMarketChart(chart, { ...state, destinations: neighbors });
  }

  function record(parent, title, lines, pick) {
    const paper = make(pick ? "button" : "article", "paper");
    if (pick) {
      paper.type = "button";
      paper.dataset.choice = pick.id;
      paper.setAttribute("aria-label", pick.label + ". " + lines.join(" "));
    }
    paper.append(make(pick ? "span" : "h3", "paper-name", title));
    lines.forEach(line => paper.append(make("span", "paper-line", line)));
    parent.append(paper);
  }

  function drawFolio(options) {
    element("chartFigure").hidden = true;
    element("chartDesc").textContent = "";
    element("observations").hidden = true;
    const folio = element("documents");
    folio.hidden = false;
    folio.replaceChildren();
    element("companion").setAttribute("aria-label", "Papers at Verran");
    if (state.phase === "quay" || state.phase === "departure") {
      element("companion").setAttribute("aria-label", "Orren inspection papers");
      folio.append(make("h2", "paper-heading", "Low Quay · inspection"));
      record(folio, "Worker’s return", ["Low Quay landing only.", "Bearing held the test barrow.", "Worker’s stamp · nick at lower edge."]);
      const limited = state.signature === "limited";
      record(folio, "Dispatch stub", [
        state.phase === "quay" ? "Scope box empty. Runner standing by." : limited ? "Low Quay landing only · spare space ruled out." : "‘Whole route’ · entered at the service desk.",
        "Worker’s stamp · nick at lower edge."
      ]);
      if (limited) record(folio, "Duty officer’s rider", ["Emergency acceptance of landing test for one loaded route stroke.", "Duty officer’s number entered against the Board order."]);
      return;
    }
    if (state.phase === "publication") {
      folio.append(make("h2", "paper-heading", "Two sets for the crews"));
      record(folio, "Your return and the duty copy", [state.signature === "limited" ? "Both copies limit work to Low Quay. The duty officer attached a separate override." : "Your original limits work to Low Quay. The duplicate went out blank and came back marked for the route."]);
      record(folio, "Donor register · Iven’s signed series", ["Seven years of Orren readings. The public summary named another shore.", "The latest loaded stroke carries Eran’s exception and Renn’s warning."]);
      record(folio, "At the door", ["Two deckhands. The launch can wait one bell. Rain is already crossing the quay."]);
      return;
    }
    if (["terms", "setting", "done"].includes(state.phase)) {
      element("companion").setAttribute("aria-label", "Freight and shore agreements");
      folio.append(make("h2", "paper-heading", "The winter bookings"));
      record(folio, "Deep berth and hand landings", model.manifest);
      record(folio, "People on the ground", [
        "Ropewalk · Refused. Branch pinned shut.",
        "Washhouse Steps · " + (state.washhouse ? "Keys issued, rent deposited, local signature entered." : "A second key is outstanding."),
        "Net Yard · " + (state.netYard ? "Paid net passage agreed and local signature entered." : "Menders have signed no agreement.")
      ]);
      if (state.phase === "done") {
        record(folio, "Landing receipts", state.settlement === "shared"
          ? ["Kite and Long May · 32 slings ashore.", "The Net Yard watch declined renewal. Both draws closed. Net hooks and washroom still under water."]
          : ["Kite and Long May · 8 slings ashore by skiff. 24 carried on.", "Washroom and net floor dry. Smaller winter measure in use."]);
        record(folio, "On the fourth high", [state.bell === "now" ? "Bela kept the dry sacks. Two hands missed the launch." : "Two hands got home. Bela stripped wet sacks from the stack.",
          state.witnessed ? "Kit’s two names witnessed." : "Kit’s claim recorded. Witness space open."]);
        return;
      }
      record(folio, "Safe setting", ["Either shore may stop before any new draw. Release begins by default at the twelfth high. The ground already taken stays under water.", "Immediate release keeps both floors dry. The upper port can take eight slings from the two bookings."]);
      return;
    }
    if (state.phase === "relief" || state.phase === "roll") {
      folio.append(make("h2", "paper-heading", "Ada’s household roll"));
      record(folio, "The room behind the oven", ["The deed names Ada’s family.", "Kit and her mother rented the room."]);
      record(folio, "After your bell", [state.bell === "now" ? "Rye under cover. Both hands missed their launch." : "Both hands crossed home. Wet sacks stripped from Bela’s stack."]);
      if (state.phase === "roll") {
        record(folio, "Facing entry", [
          "Kit’s household · Her mother’s name on Sere and the name on Kit’s Verran pay packet.",
          state.witnessed ? "The dock steward witnessed both names." : "Witness space open · Marked with a scrap of sacking."
        ]);
      }
      return;
    }
    folio.append(make("h2", "paper-heading", "At the hearing table"));
    record(folio, "Shore half of the brass tally", ["Passage 71 · Third ferry, Market Steps", "Ada’s rubbing places it beside the fixed survey cut."]);
    if (!state.receipt) {
      folio.append(make("h2", "paper-heading", "Choose a winter slip"));
      for (const [i, slip] of model.slips.entries()) {
        const pick = options.find(option => option.id === "slip" + i);
        record(folio, slip.name, slip.lines, pick);
      }
    } else {
      record(folio, model.slips[0].name, model.slips[0].lines);
      record(folio, "Passenger return", ["Third bell · Households still waiting at Market Steps.", "E. Velt · Initials beside the names."]);
      record(folio, "Second-stroke order", ["Fourth bell · Continue support at Verran’s grain berth.", "E. Velt · Authorizing officer."]);
    }
  }

  function render(focus) {
    const sea = state.phase === "approach" || state.phase === "return";
    const options = model.choices(state);
    heading.textContent = sceneHeading();
    element("narrative").textContent = state.text;
    element("watch").textContent = watchLabel();
    element("spread").classList.toggle("at-hearing", !sea);
    positionActions();
    drawActions(options);
    if (sea) drawSea();
    else drawFolio(options);
    if (focus) heading.focus();
  }

  document.addEventListener("keydown", event => {
    if (event.repeat && (event.key === " " || event.key === "Enter") && event.target.closest("button")) {
      event.preventDefault();
    }
  });

  document.addEventListener("click", event => {
    const button = event.target.closest("button[data-choice]");
    if (!button || !button.isConnected || event.detail > 1 || performance.now() < blockClickUntil) return;
    if (model.act(state, button.dataset.choice)) {
      // A replacement button can occupy the exact screen position of the previous choice.
      blockClickUntil = performance.now() + 180;
      render(true);
    }
  });

  render(false);
})();
