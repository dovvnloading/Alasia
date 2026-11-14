/* Port, field controls and the handover between the two playable studies. */
(() => {
  "use strict";
  const P = window.SoundProgression;
  const C = window.SoundCombat;
  const D = window.SoundDeep;
  const $ = id => document.getElementById(id);
  const titleCase = s => s[0].toUpperCase() + s.slice(1);
  const say = (id, value) => {
    const el = $(id);
    if (el.textContent !== value) el.textContent = value;
  };
  const professionNotes = {
    shorer: ["Brace the ground and turn a charge back through the pack.", "Set Foot near a marked incoming stroke. Stay within reach of the stake to catch the blow. Heel Strike also earns Counterload. Return Stroke hits a fan and the line to your stakes."],
    sounder: ["Read a committed attack and strike the opening from range.", "Tap Take Sounding near a pack or land a Plumb Cast. Readings belong to the marked enemy. Aim True Return at that target during its windup or recovery for a stronger answer."],
    linewright: ["Hook a moving target and pull the fight across a working line.", "Land a Lead Throw, then peg a guide with Tie Off. Move apart or let a hooked target run to build Tension. Snap Cast pulls and hits enemies along your live cable."]
  };
  const ORDER_KEY = "alasia.soundings.dispatch.v1";
  const AUDIO_KEY = "alasia.soundings.audio.v1";
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  function read(key) { try { return storage?.getItem(key); } catch { return null; } }
  function write(key, v) { try { storage?.setItem(key,v); } catch { /* The current watch still runs in memory. */ } }
  function parseDispatch(raw) {
    if (!raw || !["shared","release"].includes(raw.settlement) || !["now","warn"].includes(raw.bell)) return null;
    return {settlement:raw.settlement,bell:raw.bell};
  }
  const query = new URLSearchParams(location.search);
  let dispatch = parseDispatch(Object.fromEntries(query));
  if (dispatch) write(ORDER_KEY, JSON.stringify(dispatch));
  else try { dispatch = parseDispatch(JSON.parse(read(ORDER_KEY))); } catch { dispatch = null; }
  const quayOrders = {
    shared: {label:"Haul the net crates",description:"The Net Yard menders have paid passage. Their crates are at the eastern winch.",x:765,y:387,doneText:"The menders’ crates are aboard."},
    release: {label:"Rig the hand landing",description:"The deep berth is released. Riggers need the western winch to carry rye up to the hand landing.",x:210,y:170,doneText:"The first rye sling reached the upper landing."},
    ordinary: {label:"Haul the kit chest",description:"The watch left its kit chest at the north winch.",x:487,y:133,doneText:"The crew has its kit chest."}
  };
  const siteOrders = {
    quay: quayOrders,
    cut: {
      shared: {label:"Lift the spare collar",description:"The two shores need an unloaded spare. The packing crew is at the eastern lift.",x:772,y:360,doneText:"A spare collar is ready for the shore watches."},
      release: {label:"Raise the drain boards",description:"With the trunk bleeding down, the inspection crew can reach the old drain. Hoist their boards at the west lift.",x:191,y:184,doneText:"The inspection crew has a dry crossing."},
      ordinary: {label:"Lower the tool basket",description:"The gallery watch is waiting below the northern lift.",x:486,y:133,doneText:"The gallery crew has its tools."}
    },
    sill: {
      shared: {label:"Recover the net sled",description:"The drying floor is under water. The menders’ sled is caught below the eastern winch.",x:755,y:375,doneText:"The crew has recovered the Net Yard sled."},
      release: {label:"Hoist the spare runner",description:"The old net floor stayed dry. Its crew sent a spare runner for the hand landings. Hoist it on the western guide.",x:207,y:174,doneText:"The spare runner is aboard for the hand landings."},
      ordinary: {label:"Raise the service hook",description:"The bridge crew needs a fresh service hook from the north winch.",x:486,y:133,doneText:"A new hook hangs on the guide bridge."}
    }
  };
  let profile = P.load(storage) || P.newProfile();
  let deep = D.load(storage,profile) || D.create(profile);
  let depth = deep.active?.depth || Math.min(D.MAX_DEPTH,deep.record+1);
  let activeLeg = null;
  let grade = profile.active?.tier || profile.tier;
  let site = profile.active?.site || "quay";
  let screen = "board";
  let field = null, paused = false, raf = 0, lastFrame = 0, lastAudio = 0, lastHud = 0;
  let recoveryNote = "", soundOn = read(AUDIO_KEY) === "on", audio = null;
  let selectedRoute, showReceipt = Boolean(profile.lastResult), storageWarned = false;

  function notice(message) { say("notice", message); $("notice").hidden = !message; }
  function commit(next) {
    if (next === profile) return true;
    if (!P.save(storage, next)) {
      const latest = P.load(storage);
      if (latest && latest.saveToken !== profile.saveToken) {
        syncFromOtherTab(latest);
        return false;
      }
      storageWarned = true;
      notice("Saving is unavailable in this browser. This watch and its rewards will last for this tab only.");
    }
    profile = next;
    return true;
  }
  function syncFromOtherTab(latest) {
    stopField();
    profile = latest;
    deep = D.load(storage,profile) || D.create(profile);
    depth = deep.active?.depth || Math.min(D.MAX_DEPTH,deep.record+1);
    activeLeg = null; recoveryNote = "";
    grade = profile.active?.tier || profile.tier;
    site = profile.active?.site || "quay";
    showReceipt = Boolean(profile.lastResult);
    showStation("board");
    notice("Another tab updated this locker. The board now shows the latest saved watch.");
  }
  window.addEventListener("storage", e => {
    if (e.key === D.SAVE_KEY+"."+profile.seed) {
      const other = D.load(storage,profile);
      if (other && other.saveToken !== deep.saveToken) syncFromOtherTab(P.load(storage) || profile);
    } else if (e.key === P.SAVE_KEY) {
      const latest = P.load(storage);
      if (latest && latest.saveToken !== profile.saveToken) syncFromOtherTab(latest);
    }
  });
  const label = (name, text) => { const el = document.createElement(name); el.textContent = text; return el; };
  function button(text, handler, className) {
    const el = label("button", text);
    el.type = "button";
    if (className) el.className = className;
    el.addEventListener("click", handler);
    return el;
  }
  function choice(container, title, body, foot, handler, selected, disabled = false) {
    const el = button("", handler);
    el.append(label("strong", title), label("span", body), label("small", foot));
    if (selected !== null) el.setAttribute("aria-pressed", String(selected));
    el.disabled = disabled;
    container.append(el);
  }
  function showStation(tab) {
    screen = tab;
    $("station").hidden = false;
    $("field").hidden = true;
    document.body.classList.remove("in-field");
    $("board").hidden = tab !== "board";
    $("workshop").hidden = tab !== "workshop";
    $("debrief").hidden = tab !== "board" || !profile.lastResult || !showReceipt || Boolean(deep.active);
    $("board-tab").disabled = false;
    $("shop-tab").disabled = false;
    $("story-link").hidden = false;
    for (const [key,value] of [["board-tab","board"],["shop-tab","workshop"]]) {
      if (tab === value) $(key).setAttribute("aria-current","page");
      else $(key).removeAttribute("aria-current");
    }
    say("level","Level " + profile.level);
    say("currency",profile.salvage + " salvage");
    $("dispatch").hidden = !dispatch;
    if (dispatch) say("dispatch", (dispatch.settlement === "shared" ? "Selwick has a boat for the Net Yard menders. " : "The upper kitchens have moved to the smaller rye scoop. ") +
      (dispatch.bell === "now" ? "Bela’s sacks are dry. The two hands who missed the launch take your next quay watch." : "The two hands are home. Bela’s crew is stripping the wet sacks for salvage."));
    if (tab === "workshop") drawWorkshop();
    else { drawBoard(); drawDeep(); if (!$("debrief").hidden) drawReceipt(); }
  }
  function drawBoard() {
    const lock = profile.active;
    grade = lock?.tier || Math.max(1, Math.min(grade, profile.tier));
    const options = P.getContracts(profile, grade);
    selectedRoute = lock || options.find(c => c.site === site) || options[0];
    site = selectedRoute.site;
    const gradeSelect = $("grade");
    gradeSelect.replaceChildren();
    P.GRADES.slice(0,profile.tier).forEach((_,i) => { const opt = label("option",String(i+1)); opt.value = i+1; gradeSelect.append(opt); });
    gradeSelect.value = grade;
    gradeSelect.disabled = Boolean(lock) || profile.tier === 1;
    const list = $("contracts");
    list.replaceChildren();
    options.forEach(c => {
      const b = button("", () => { site = c.site; drawBoard(); list.querySelector('[aria-pressed="true"]').focus(); });
      b.setAttribute("aria-pressed",String(site === c.site));
      b.disabled = Boolean(lock && lock.id !== c.id);
      b.append(label("strong",c.name), label("span",c.cleared ? "✓" : "↗"), label("small",c.modifierName + " · " + c.district + (c.cleared ? " · Cleared" : "")));
      list.append(b);
    });
    $("feature").dataset.site = site;
    say("site-place", selectedRoute.district + " / " + selectedRoute.gradeName);
    say("site-title",selectedRoute.name);
    say("site-brief",selectedRoute.description + " " + selectedRoute.modifierDescription + (selectedRoute.bestSeconds ? " Personal best "+selectedRoute.bestSeconds.toFixed(2)+"s." : ""));
    say("launch",lock ? "Rejoin this watch →" : "Take contract →");
    say("target-drop",selectedRoute.rewardHint);
    $("launch").disabled=Boolean(deep.active);
    if (deep.active) say("launch","Deep Watch underway");
    const gp = P.getGradeProgress(profile,grade);
    say("grade-progress", (gp.complete ? "Grade signed off. " : gp.sitesCleared + "/" + gp.required + " different sites cleared. ") +
      (gp.topGrade ? "All three crews award the Standing Watch Collar." : "Clear two different sites at this grade to open the next."));
    say("active-class",titleCase(profile.classId));
    say("class-line",professionNotes[profile.classId][0]);
    const item = profile.inventory.find(i => i.id === profile.equipped);
    const mastery = P.getMasteries(profile).find(m => m.id === profile.mastery);
    const equippedTechnique = P.getTechniques(profile).find(t => t.id === profile.techniques[profile.classId]);
    say("equipped-line",[item.name, equippedTechnique.name, mastery.name].join("  ·  "));
  }
  function compare(item) {
    const before = P.getBuild(profile), after = P.getBuild(profile,item);
    const change = (a,b) => (b>a ? "+" : "") + (b-a);
    const stats = [];
    if (before.maxHp !== after.maxHp) stats.push(change(before.maxHp,after.maxHp)+" max health");
    for (const [key,name] of [["power","base power"],["recovery","primary speed"]]) {
      const delta = Math.round((after[key]/before[key]-1)*100);
      if (delta) stats.push((delta>0?"+":"")+delta+"% "+name);
    }
    const current = profile.inventory.find(i => i.id === profile.equipped);
    if (current.style !== after.style) stats.push("replaces " + current.name);
    return stats.length ? stats.join(" · ") : "same base stats";
  }
  function drawWorkshop() {
    const locked = Boolean(profile.active || deep.active);
    const pp = $("professions"), tt = $("techniques"), mm = $("masteries"), ll = $("locker"), rr = $("recipes");
    [pp,tt,mm,ll,rr].forEach(e => e.replaceChildren());
    const mutate = (fn,id) => {
      const focused = document.activeElement?.closest(".options")?.id;
      const previousText = document.activeElement?.querySelector("strong")?.textContent;
      if (!commit(fn(profile,id))) return;
      showStation("workshop");
      if (focused) Array.from($(focused).querySelectorAll("button")).find(b => !b.disabled && b.querySelector("strong")?.textContent === previousText)?.focus();
    };
    P.CLASS_IDS.forEach(id => choice(pp,titleCase(id),professionNotes[id][0], [C.CLASSES[id].primary,C.CLASSES[id].tool,C.CLASSES[id].skill].join(" · "),() => mutate(P.setClass,id), id===profile.classId, locked));
    const selectedTechnique = profile.techniques[profile.classId];
    for (const t of P.getTechniques(profile)) {
      const status = t.unlocked ? (selectedTechnique === t.id ? "Active" : "Fit technique") : "Opens at level " + t.level;
      choice(tt,t.name,t.description,status,() => mutate(P.setTechnique,t.id),selectedTechnique === t.id,locked || !t.unlocked);
    }
    P.getMasteries(profile).forEach(m => choice(mm,m.name,m.description, m.unlocked ? (profile.mastery === m.id ? "Active" : "Select mastery") : "Opens at level "+m.level, () => mutate(P.setMastery,m.id),m.id===profile.mastery,locked || !m.unlocked));
    profile.inventory.forEach(i => choice(ll,i.name,i.description,(i.id===profile.equipped?"Equipped":"Equip · "+compare(i))+" · "+i.gradeName,()=>mutate(P.equip,i.id),i.id===profile.equipped,locked));
    P.getRecipes(profile).forEach(r => choice(rr,r.name,r.description,r.owned?"In locker":!r.unlocked?"Clear "+r.siteName+" to learn":r.cost+" salvage · "+r.item.gradeName+" · "+compare(r.item),()=>mutate(P.craft,r.id),null,locked || r.owned || !r.unlocked || !r.affordable));
    const xp = P.getLevelProgress(profile);
    say("rank-progress", (locked ? "This watch is underway. Return to port to change equipment. " : "") +
      (xp.needed ? xp.current+"/"+xp.needed+" XP toward level "+(profile.level+1)+"." : "Maximum profession level reached.")+" All three professions share the locker and the board.");
  }
  function drawReceipt() {
    const r = profile.lastResult;
    say("result-title",r.won ? "Watch completed" : "Watch recalled");
    say("result-copy",r.message);
    say("result-label",(r.won ? "+"+r.xp+" XP / +"+r.salvage+" salvage" : "Return to port") + (r.previousLevel < profile.level ? " / Level "+profile.level : ""));
    say("result-drop",[r.item ? r.item.name+" · "+r.item.description : "", r.fieldSalvage ? r.fieldPieces+" field parts delivered for "+r.fieldSalvage+" of the salvage above." : ""].filter(Boolean).join(" "));
    const timing = r.seconds ? r.seconds.toFixed(2)+"s"+(r.firstRecord?" · First recorded clear.":r.newPersonalBest?" · Personal best (previously "+r.previousBestSeconds.toFixed(2)+"s).":".") : "";
    say("result-order",[recoveryNote,timing].filter(Boolean).join(" "));
    const actions = $("result-actions"); actions.replaceChildren();
    if (r.item || r.commission) {
      const item = r.commission || r.item;
      actions.append(button(profile.equipped===item.id?"Equipped":"Equip "+item.name,()=>{
        if (commit(P.equip(profile,item.id))) showStation("board");
      },"outline"));
    }
    actions.append(button(r.won?"Choose next contract":"Retry this contract",()=>{
      showReceipt=false;
      if (!r.won) { grade=r.tier; site=r.site; showStation("board"); launch(); }
      else {showStation("board");$("launch").focus();}
    },"brass"));
  }

  // A new ticket can be replayed from its first pack after reloading. Only
  // settlement at port awards XP, salvage or gear.
  function launch() {
    if (screen === "field" || deep.active) return;
    if (!profile.active && !commit(P.startRun(profile,selectedRoute.id,grade))) return;
    if (!profile.active) return;
    activeLeg = null;
    beginField(profile.active,P.getBuild(profile));
  }
  function beginField(ticket,build) {
    clearControls();
    screen="field"; showReceipt=false; paused=false; lastFrame=0; lastHud=0; lastAudio=0; recoveryNote="";
    const dispatchKey=ORDER_KEY+".watch";
    const id=activeLeg || ticket.id;
    let manifest;
    try { manifest=JSON.parse(read(dispatchKey)); } catch { manifest=null; }
    if(!manifest || manifest.id!==id || !Object.hasOwn(quayOrders,manifest.order)) {
      manifest={id,order:dispatch?.settlement || "ordinary",bell:dispatch?.bell};
      write(dispatchKey,JSON.stringify(manifest));
    }
    const order={...siteOrders[ticket.site][manifest.order]};
    if(manifest.bell==="warn") order.description+=" Bela’s crew has sent a dry sling.";
    if(manifest.bell==="now") order.description+=" Kit’s stranded shift is on the hauling rope.";
    field=C.createEncounter({...ticket,build,workOrder:order});
    if (!storageWarned) notice("");
    $("station").hidden=true; $("field").hidden=false; $("overlay").hidden=true;
    $("board-tab").disabled=true; $("shop-tab").disabled=true; $("story-link").hidden=true;
    document.body.classList.add("in-field");
    $("board-tab").removeAttribute("aria-current"); $("shop-tab").removeAttribute("aria-current");
    say("field-title",ticket.name);
    say("field-grade",activeLeg?"Deep Watch "+deep.active.depth+" / Leg "+(deep.active.leg+1)+" / "+ticket.modifierText:"Grade "+ticket.tier+" / "+ticket.modifierName);
    say("resource-name",C.CLASSES[build.classId].resource);
    const technique = P.getTechniques({...profile,classId:build.classId}).find(t => t.id === (build.technique || "standard"));
    say("technique",professionNotes[build.classId][1]+" "+technique.description);
    buildSkills(build.classId);
    const firstHint = $("first-help");
    firstHint.hidden = profile.clears > 0 || Boolean(activeLeg);
    if (!firstHint.hidden) {
      const kit=C.CLASSES[build.classId];
      const touch = matchMedia("(pointer:coarse)").matches;
      firstHint.textContent = touch
        ? "Drag the pad to move. Hold " + kit.primary + " to strike, then tap " + kit.skill + ". Tap Evade to clear the painted rush."
        : "Click an enemy to close and strike, or move with WASD and hold J. E · " + kit.tool + ". Q · " + kit.skill + ". Evade the painted rush with Space.";
    }
    $("field").scrollIntoView({block:"start"}); $("arena").focus({preventScroll:true});
    soundStart();
    drawHud(); window.SoundArena.draw($("arena"),field,{reducedMotion:reducedMotion.matches});
    raf=requestAnimationFrame(frame);
  }
  function stopField() {
    cancelAnimationFrame(raf); field=null; paused=false; clearControls();
  }
  function settle(won, withdrawn=false) {
    const work=field.workOrder, cause=field.lastHitCause;
    recoveryNote = work.done ? work.doneText : (withdrawn ? "You signalled for a boat back." : (!won && cause ? "Last hit: "+cause+"." : ""));
    if (activeLeg) {
      const resolved=D.resolve(deep,activeLeg,won,field.player.hp/field.player.maxHp);
      if (!saveDeep(resolved)) return;
      stopField(); activeLeg=null; showReceipt=false;
      showStation("board"); $("deep-panel").focus(); $("deep-panel").scrollIntoView({block:"center"});
      return;
    }
    if (!commit(P.finishRun(profile,won,{seconds:field.elapsed,salvageCollected:field.salvageCollected}))) return;
    stopField(); grade=won?profile.tier:profile.lastResult.tier; site=profile.lastResult.site;
    showReceipt=true; showStation("board"); $("debrief").focus(); $("debrief").scrollIntoView({block:"center"});
  }
  function pause(value) {
    if (!field || paused===value) return;
    paused=value; clearControls(); $("overlay").hidden=!value;
    if (value) {
      say("overlay-label","Watch held"); say("overlay-title","Paused");
      say("overlay-copy","Resume at this position or return to port with the gear you brought. Reloading starts this contract again at its first pack.");
      $("resume").focus();
    } else { lastFrame=0; $("arena").focus({preventScroll:true}); }
  }
  function saveDeep(next) {
    if(next===deep) return false;
    if(!D.save(storage,next)) {
      const latest=D.load(storage,profile);
      if(latest && latest.saveToken!==deep.saveToken) {
        syncFromOtherTab(P.load(storage) || profile);
        return false;
      }
      storageWarned=true;
      notice("Saving is unavailable. This Deep Watch will last for this tab only.");
    }
    deep=next;
    return true;
  }
  function launchLeg() {
    if(profile.active) return;
    const config=D.encounter(deep);
    activeLeg=D.ticket(deep);
    if(config && activeLeg) beginField(config,config.build);
  }
  function drawDeep() {
    const panel=$("deep-panel");
    panel.hidden=!D.isUnlocked(profile);
    if(panel.hidden) return;
    depth=deep.active?.depth || Math.min(depth,deep.record+1,D.MAX_DEPTH);
    const run=deep.active, entry=deep.lastResult, sel=$("depth");
    sel.replaceChildren();
    for(let i=1;i<=Math.min(deep.record+1,D.MAX_DEPTH);i++){
      const o=label("option",String(i));o.value=i;sel.append(o);
    }
    sel.value=depth;sel.disabled=Boolean(run);
    say("deep-record","Standing Watch / Best depth "+deep.record+" of "+D.MAX_DEPTH);
    say("deep-summary",run && run.phase==="camp" ? "Shore camp · "+Math.round(run.health*100)+"% health. Choose what the bench crew does before the next leg." :
      "Take one build across three sites. Health carries between legs. Two tide conditions apply together. A lost leg recalls the crew to port.");
    const itinerary=$("deep-route");itinerary.replaceChildren();
    D.itinerary(deep,depth).forEach((leg,i)=>{
      const li=label("li",leg.name+" · "+leg.modifierText+(run && (i<run.leg || (i===run.leg && run.phase==="camp"))?" · Cleared":""));
      if(run && i===run.leg)li.setAttribute("aria-current","step");
      itinerary.append(li);
    });
    say("deep-outcome",entry?(entry.won?"Depth "+entry.depth+" charted. The crews have posted a new route.":"Recalled on leg "+(entry.leg+1)+". The same route awaits."):"");
    const a=$("deep-actions");a.replaceChildren();
    if(run?.phase==="camp") {
      for(const [id,caption] of [["repair","Repair · +40% max health"],["tune","Tune · +14% tool damage"]]) {
        a.append(button(caption,()=>{if(saveDeep(D.choose(deep,id)))launchLeg();},"outline"));
      }
      a.append(button("End this watch",()=>{if(saveDeep(D.retire(deep)))showStation("board");},"outline"));
    } else {
      const b=button(run?"Rejoin leg "+(run.leg+1):"Take Deep Watch",()=>{
        if(profile.active)return;
        if(!deep.active && !saveDeep(D.start(deep,profile,depth)))return;
        launchLeg();
      },"brass");
      b.disabled=Boolean(profile.active);a.append(b);
    }
  }
  $("depth").addEventListener("change",e=>{depth=Number(e.target.value);drawDeep();});
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
  const keys = new Set(), held = new Map(), taps = new Set();
  const keyMap = {KeyJ:"primary",KeyE:"tool",KeyQ:"skill",Space:"dodge",KeyR:"interact"};
  let pointerAim=null, destination=null, targetId=null, stickId=null, stickX=0, stickY=0, padPause=false;
  const skills = [["primary","J"],["tool","E"],["skill","Q"],["dodge","Space"],["interact","R"]];
  function clearControls() {
    keys.clear(); held.clear(); taps.clear(); pointerAim=null; destination=null; targetId=null;
    stickId=null; stickX=stickY=0;
    const nub=$("stick").firstElementChild;
    if (nub) nub.style.transform="";
  }
  function buildSkills(id) {
    const group=$("skills"); group.replaceChildren();
    const names={...C.CLASSES[id],dodge:"Evade",interact:"Work"};
    for (const [action,key] of skills) {
      const b=button("",()=>{}); b.dataset.action=action;
      b.append(label("kbd",key),label("span",names[action]), label("small",""));
      b.addEventListener("pointerdown",e=>{
        if (!field || paused || e.button!==0) return;
        e.preventDefault(); pointerAim=null; b.setPointerCapture(e.pointerId);
        held.set(e.pointerId,action); taps.add(action);
      });
      b.addEventListener("lostpointercapture",e=>held.delete(e.pointerId));
      b.addEventListener("click",e=>{ if (e.detail===0 && !paused) taps.add(action); });
      group.append(b);
    }
  }
  const moveCodes=["KeyW","KeyA","KeyS","KeyD","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"];
  window.addEventListener("keydown",e=>{
    if (!field || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code==="Escape") { e.preventDefault(); if(!e.repeat) pause(!paused); return; }
    if (paused || !(moveCodes.includes(e.code) || keyMap[e.code])) return;
    if ((e.code==="Space" || e.code.startsWith("Arrow")) && e.target.closest("button,summary,select")) return;
    e.preventDefault(); keys.add(e.code); pointerAim=null; targetId=null; destination=null;
    if (!e.repeat && keyMap[e.code]) taps.add(keyMap[e.code]);
  });
  window.addEventListener("keyup", e=>keys.delete(e.code));
  const arena=$("arena");
  function worldPoint(e) {
    const box=arena.getBoundingClientRect();
    return {x:(e.clientX-box.left)*C.WIDTH/box.width,y:(e.clientY-box.top)*C.HEIGHT/box.height};
  }
  function pickAt(p) {
    let best=null, nearest=Infinity;
    for (const foe of field.enemies) {
      const d=Math.hypot(foe.x-p.x,foe.y-p.y);
      if(d<=foe.radius+13 && d<nearest) {best=foe;nearest=d;}
    }
    return best;
  }
  arena.addEventListener("contextmenu", e=>e.preventDefault());
  arena.addEventListener("pointerdown",e=>{
    if (!field || paused || ![0,2].includes(e.button)) return;
    e.preventDefault(); arena.focus({preventScroll:true}); arena.setPointerCapture(e.pointerId);
    pointerAim=worldPoint(e);
    if(e.button===2 || e.shiftKey) {
      const action=e.button===2?"skill":"primary";
      held.set(e.pointerId,action); taps.add(action); targetId=null; destination=null; return;
    }
    const foe=pickAt(pointerAim);
    targetId=foe?.id || null;
    destination=foe ? null : {x:Math.max(C.BANK.left+9,Math.min(C.BANK.right-9,pointerAim.x)),y:Math.max(C.BANK.top+9,Math.min(C.BANK.bottom-9,pointerAim.y))};
    if(field.workOrder && Math.hypot(pointerAim.x-field.workOrder.x,pointerAim.y-field.workOrder.y)<25 && !foe) {
      destination={...field.workOrder,work:true};
    }
  });
  arena.addEventListener("pointermove",e=>{
    if (field && !paused && e.pointerType!=="touch" && (e.buttons!==0 || !targetId)) pointerAim=worldPoint(e);
  });
  arena.addEventListener("pointerleave",()=>{if(!targetId) pointerAim=null;});
  window.addEventListener("pointerup",e=>held.delete(e.pointerId));
  window.addEventListener("pointercancel",e=>held.delete(e.pointerId));
  const stick=$("stick");
  function setStick(e) {
    const rect=stick.getBoundingClientRect(), r=rect.width/2;
    const x=(e.clientX-rect.left-r)/(r*0.75),y=(e.clientY-rect.top-r)/(r*0.75),length=Math.max(1,Math.hypot(x,y));
    stickX=x/length;stickY=y/length;stick.firstElementChild.style.transform="translate("+stickX*r*.55+"px,"+stickY*r*.55+"px)";
  }
  stick.addEventListener("pointerdown",e=>{
    if (paused || stickId!==null) return;
    e.preventDefault(); stickId=e.pointerId; pointerAim=null; destination=null; targetId=null;
    stick.setPointerCapture(e.pointerId); setStick(e);
  });
  stick.addEventListener("pointermove",e=>{if(e.pointerId===stickId) setStick(e);});
  stick.addEventListener("lostpointercapture",e=>{
    if(e.pointerId===stickId){stickX=stickY=0;stickId=null;stick.firstElementChild.style.transform="";}
  });
  function gamepad() {
    try { return Array.from(navigator.getGamepads?.() || []).find(p=>p?.connected && p.mapping==="standard"); }
    catch {return null;}
  }
  const axis = v=>Math.abs(v || 0)>.19?v:0;
  function inputState(pad) {
    const p=field.player;
    let x=Number(keys.has("KeyD")||keys.has("ArrowRight"))-Number(keys.has("KeyA")||keys.has("ArrowLeft"))+stickX+axis(pad?.axes[0]);
    let y=Number(keys.has("KeyS")||keys.has("ArrowDown"))-Number(keys.has("KeyW")||keys.has("ArrowUp"))+stickY+axis(pad?.axes[1]);
    const actions=new Set([...held.values(),...taps,...Array.from(keys,k=>keyMap[k]).filter(Boolean)]); taps.clear();
    const padActions=[[7,"primary"],[2,"tool"],[3,"skill"],[0,"dodge"],[1,"interact"]];
    for(const [i,a] of padActions) if(pad?.buttons[i]?.pressed) actions.add(a);
    const rx=axis(pad?.axes[2]),ry=axis(pad?.axes[3]);
    if(x||y||rx||ry) {targetId=null;destination=null;}
    const enemy=targetId && field.enemies.find(e=>e.id===targetId);
    if(targetId && !enemy){targetId=null;pointerAim=null;}
    let aim=enemy || pointerAim;
    if(rx || ry) aim={x:p.x+220*rx,y:p.y+220*ry};
    else if(pad && (axis(pad.axes[0]) || axis(pad.axes[1]) || padActions.some(([i]) => pad.buttons[i]?.pressed))) aim=enemy || null;
    const goal=enemy || destination;
    if(goal) {
      const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy);
      const stop=enemy ? C.CLASSES[field.classId].reach*(field.style==="reach"?1.35:1)+enemy.radius-6 : (goal.work?C.WORK_REACH-4:4);
      if(d>stop) {x=dx/d;y=dy/d;}
      else if(enemy) actions.add("primary");
      else {if(goal.work) actions.add("interact");destination=null;}
    }
    return {x,y,aimX:aim?.x,aimY:aim?.y,...Object.fromEntries(Array.from(actions,a=>[a,true]))};
  }
  function soundStart() {
    if(!soundOn) return;
    try {
      const Audio=window.AudioContext || window.webkitAudioContext;
      if(!Audio) return;
      if(!audio) audio=new Audio();
      if(audio.state==="suspended") audio.resume().catch(()=>{});
    } catch { audio=null; }
  }
  const tones={primary:[120,65,.05],contact:[300,74,.065],skill:[340,52,.2],tool:[465,209,.12],dodge:[175,80,.08],guard:[740,280,.18],hurt:[110,44,.15],work:[420,620,.22],boss:[150,73,.32],victory:[350,705,.32],defeat:[210,55,.4]};
  function playCue(type) {
    const note=tones[type];
    if(!soundOn || !audio || !note || audio.state!=="running") return;
    const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
    osc.type=["primary","contact","hurt","skill"].includes(type)?"triangle":"sine";
    osc.frequency.setValueAtTime(note[0],t);osc.frequency.exponentialRampToValueAtTime(note[1],t+note[2]);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,t+note[2]);
    osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+note[2]+.015);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function drawHud() {
    const p=field.player;
    for(const [id,value,max] of [["health",p.hp,p.maxHp],["resource",p.resource,p.maxResource]]) {
      $(id).max=max;$(id).value=value;say(id+"-text",Math.ceil(value)+" / "+max);
    }
    const order=field.workOrder;
    const vent=C.ventAvailable?.(field);
    const close=Math.hypot(p.x-order.x,p.y-order.y)<=C.WORK_REACH;
    let orderText = order.description + (close ? " Press R to work." : " Work the marked winch for up to 10 health.");
    if (order.done) orderText = order.doneText;
    if (vent) orderText = "The return is exposed. Work the fitting now (R).";
    say("work-order",orderText);
    const obj="Pack "+field.wave+"/"+field.waveCount+" · "+field.objective;
    const haul=activeLeg?"":" · "+(field.salvageCollected || 0)+"/3 parts";
    say("objective",obj+haul+(field.cueTime>0?" · "+field.cue:""));
    say("announcer",obj+haul+(order.done?" · "+order.doneText:""));
    for(const b of $("skills").children) {
      const action=b.dataset.action;
      const time=p[{primary:"attackCooldown",skill:"skillCooldown",tool:"toolCooldown",dodge:"dodgeCooldown"}[action]] || 0;
      const hint=action==="skill"?C.spendHint?.(field):"";
      let txt = "";
      if (action === "skill" && p.resource < p.skillCost) txt = p.skillCost + " needed";
      else if (time > .25) txt = time.toFixed(1) + "s";
      else if (action === "interact" && vent) txt = "Vent";
      else if (action === "interact" && order.done) txt = "Hauled";
      else if (action === "skill" && hint) txt = hint;
      b.dataset.cooling=String(time>.25 || action==="skill" && Boolean(hint));b.title=hint || "";
      if(b.lastElementChild.textContent!==txt)b.lastElementChild.textContent=txt;
    }
  }
  function frame(now) {
    if(!field) return;
    const pad=gamepad(), toggle=Boolean(pad?.buttons[9]?.pressed);
    if(toggle && !padPause) pause(!paused);
    padPause=toggle;
    if(!paused) {
      const dt=lastFrame ? Math.min(.06,(now-lastFrame)/1000) : 1/60;
      C.step(field,inputState(pad),dt);
      window.SoundArena.draw(arena,field,{reducedMotion:reducedMotion.matches});
      for(const a of field.audioCues) if(a.id>lastAudio) playCue(a.type);
      lastAudio=field.audioId;
      if(now-lastHud>100 || field.status!=="active"){drawHud();lastHud=now;}
      if(field.status!=="active"){settle(field.status==="victory");return;}
    }
    lastFrame=now; raf=requestAnimationFrame(frame);
  }
  $("sound-toggle").addEventListener("click",()=>{
    soundOn=!soundOn;write(AUDIO_KEY,soundOn?"on":"off");soundStart();
    if(soundOn) playCue("tool");
    updateSound();
  });
  function updateSound() {
    say("sound-toggle",soundOn?"Sound on":"Sound off");
    $("sound-toggle").setAttribute("aria-pressed",String(soundOn));
  }
  $("board-tab").addEventListener("click",()=>showStation("board"));
  $("shop-tab").addEventListener("click",()=>showStation("workshop"));
  $("open-workshop").addEventListener("click",()=>{showStation("workshop");$("return-board").focus();});
  $("return-board").addEventListener("click",()=>{showStation("board");$("launch").focus();});
  $("grade").addEventListener("change",e=>{grade=Number(e.target.value);drawBoard();});
  $("launch").addEventListener("click",launch);
  $("pause").addEventListener("click",()=>pause(!paused));
  $("resume").addEventListener("click",()=>pause(false));
  $("withdraw").addEventListener("click",()=>{if(field && paused)settle(false,true);});
  window.addEventListener("blur",()=>{if(field)pause(true);});
  document.addEventListener("visibilitychange",()=>{if(document.hidden && field)pause(true);});
  updateSound(); showStation("board");
})();
