// Real Chromium smoke using its built-in DevTools pipe. Run on Node 20+ with
// Chrome on PATH (or CHROME_BIN=/path/to/chrome). No browser-driver packages.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const chrome = process.env.CHROME_BIN || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
assert.ok(chrome, "Set CHROME_BIN to a Chromium executable");
const temporary = mkdtempSync(path.join(tmpdir(), "alasia-watch-"));
const child = spawn(chrome, [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking",
  "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-pipe",
  "--window-size=1280,900", "--user-data-dir=" + temporary, "about:blank"
], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });

let sequence = 0, buffer = "", errors = "", sessionId;
const waiting = new Map(), exceptions = [];
child.stderr.on("data", bytes => { errors = (errors + bytes).slice(-3000); });
child.stdio[4].setEncoding("utf8").on("data", chunk => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf("\0")) !== -1) {
    const event = JSON.parse(buffer.slice(0, index));
    buffer = buffer.slice(index + 1);
    if (event.method === "Runtime.exceptionThrown") exceptions.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    const pending = waiting.get(event.id);
    if (pending) {
      waiting.delete(event.id);
      if (event.error) pending.reject(Error(event.error.message));
      else pending.resolve(event.result);
    }
  }
});
child.once("exit", (code, signal) => {
  for (const {reject} of waiting.values()) reject(Error("Chromium exited " + (code ?? signal) + "\n" + errors));
  waiting.clear();
});
function command(method, params = {}, session = sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    waiting.set(id, {resolve, reject});
    child.stdio[3].write(JSON.stringify({id, method, params, sessionId:session}) + "\0");
  });
}
async function evaluate(expression) {
  const {result, exceptionDetails} = await command("Runtime.evaluate", {expression, returnByValue:true, awaitPromise:true});
  if (exceptionDetails) throw Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const url = pathToFileURL(path.join(root, "studies/soundings.html")).href;
async function navigate(query) {
  // Leave the previous document first so the ready predicate cannot see it.
  await command("Page.navigate", {url:"about:blank"});
  await command("Page.navigate", {url:url + query});
  for (let attempt = 0; attempt < 250; attempt++) {
    if (await evaluate("document.readyState === 'complete' && document.querySelector('#site-title')?.textContent.length > 0")) return;
    await pause(20);
  }
  throw Error("Soundings did not reach its board: " + exceptions.join("; "));
}

// The harness advances the real frame callback on a fixed clock. The renderer
// observer exposes positions to a keyboard pilot. No combat objects are changed.
function setupHarness() {
  if (location.protocol === "about:") return;
  const frames = new Map();
  let next = 0, clock = 1000;
  window.requestAnimationFrame = callback => {frames.set(++next, callback); return next;};
  window.cancelAnimationFrame = id => frames.delete(id);
  const smoke = window.smoke = {
    frame() {
      clock += 50;
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(clock);
    },
    key(code, on) {
      const event = new KeyboardEvent(on ? "keydown" : "keyup", {code,bubbles:true,cancelable:true});
      document.querySelector("#arena").dispatchEvent(event);
    },
    click(selector, text) {
      const element = [...document.querySelectorAll(selector)].find(el => !text || el.textContent.startsWith(text));
      if (!element || element.disabled || !element.getClientRects().length) throw Error("Unavailable control: " + selector + " " + (text || ""));
      element.click();
    }
  };
  window.addEventListener("DOMContentLoaded", () => {
    const draw = window.SoundArena.draw;
    window.SoundArena.draw = (canvas, state, options) => {
      smoke.field = state;
      return draw(canvas, state, options);
    };
  });
}

// Run in Chromium. Follow visible attack shapes with ordinary movement keys,
// button presses and automatic keyboard aim. The field settles via its own RAF.
function fight() {
  const h = window.smoke, C = window.SoundCombat;
  const keys = new Set();
  const radius = s => C.CLASSES[s.classId].reach * (s.style === "reach" ? 1.35 : 1);
  for(let tick=0;tick<4000;tick++) {
    const s=h.field,p=s.player;
    if(s.status!=="active") {
      for (const k of keys) h.key(k,false);
      if (s.status!=="victory") throw Error(s.site+" lost to "+s.lastHitCause+" after "+s.elapsed.toFixed(2));
      return s.kills;
    }
    const distance=e=>Math.hypot(p.x-e.x,p.y-e.y);
    const e=s.enemies.reduce((a,b)=>!a || distance(b)<distance(a)?b:a,null);
    let x=0,y=0,evade=false;
    if(e) {
      const d=distance(e),reach=radius(s);
      if(d>reach*.82+e.radius){x=(e.x-p.x)/d;y=(e.y-p.y)/d;}
      const danger=s.hazards.map(hazard=>hazard.shape).concat(s.enemies.filter(f=>f.mode==="windup"||f.mode==="charge").flatMap(f=>f.shapes));
      if(danger.some(shape=>C.intersects(shape,p,13))) {
        let best=-Infinity;
        for(let dir=0;dir<8;dir++){
          const angle=dir*Math.PI/4,dx=Math.round(Math.cos(angle)),dy=Math.round(Math.sin(angle));
          const travel=(p.dodgeCooldown<=0?100:67)/Math.hypot(dx,dy);
          const next={x:Math.max(54,Math.min(906,p.x+dx*travel)),y:Math.max(65,Math.min(482,p.y+dy*travel))};
          const score=-1000*danger.filter(shape=>C.intersects(shape,next,13)).length+distance(next)
            -.12*Math.abs(Math.hypot(next.x-e.x,next.y-e.y)-reach*.72);
          if(score>best){best=score;x=dx;y=dy;}
        }
        evade=true;
      }
    }
    const desired = new Set(["KeyJ","KeyR"]);
    if(Math.abs(x)>.38)desired.add(x<0?"KeyA":"KeyD");
    if(Math.abs(y)>.38)desired.add(y<0?"KeyW":"KeyS");
    if(tick%4<2){desired.add("KeyQ");desired.add("KeyE");}
    if(evade)desired.add("Space");
    for(const k of keys)if(!desired.has(k)){h.key(k,false);keys.delete(k);}
    for(const k of desired)if(!keys.has(k)){h.key(k,true);keys.add(k);}
    h.frame();
  }
  throw Error("Watch failed to settle: "+h.field.site);
}

async function smoke() {
  const {targetId} = await command("Target.createTarget", {url:"about:blank"});
  ({sessionId} = await command("Target.attachToTarget", {targetId, flatten:true}));
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Page.addScriptToEvaluateOnNewDocument", {source:"("+setupHarness.toString()+")()"});
  await navigate("?settlement=shared&bell=now");
  const click = (selector,text)=>evaluate("smoke.click("+JSON.stringify(selector)+","+JSON.stringify(text||"")+")");
  const text = id=>evaluate("document.getElementById("+JSON.stringify(id)+").textContent");
  async function capture(name) {
    const dir=process.env.SOUNDINGS_CAPTURE_DIR;
    if (!dir) return;
    mkdirSync(dir,{recursive:true});
    const image=await command("Page.captureScreenshot",{format:"png"});
    writeFileSync(path.join(dir,name+".png"),Buffer.from(image.data,"base64"));
  }
  const liveProfile=()=>evaluate("SoundProgression.load(localStorage)");
  const win=()=>evaluate("("+fight.toString()+")()");
  const haul = () => evaluate(`{
    const h=smoke,p=h.field.player,w=h.field.workOrder;
    for(let i=0; i<130 && !w.done; i++) {
      const dx=w.x-p.x,dy=w.y-p.y;
      for(const [code,on] of [["KeyA",dx< -5],["KeyD",dx>5],["KeyW",dy< -5],["KeyS",dy>5],["KeyR",true]])h.key(code,on);
      h.frame();
    }
    for(const code of ["KeyA","KeyD","KeyW","KeyS","KeyR"])h.key(code,false);
    for(let i=0;i<4;i++)h.frame();
    if(!w.done)throw Error("Dispatch winch did not accept the haul");
  }`);


  // Fix the opening board seed while retaining the normal fresh-character build.
  await evaluate("SoundProgression.save(localStorage,SoundProgression.newProfile('sounder',12018))");
  await navigate("?settlement=shared&bell=now");
  await capture("station");
  await click("#launch");
  assert.match(await text("work-order"), /net crates|menders/i);
  await capture("active");
  const first=await liveProfile();
  const before=await evaluate("smoke.field.player.x");
  await evaluate('smoke.key("KeyD",true); for(let i=0;i<8;i++)smoke.frame(); smoke.key("KeyD",false)');
  assert.ok(await evaluate("smoke.field.player.x")>before);
  await evaluate('smoke.key("Escape",true);smoke.key("Escape",false)');
  assert.equal(await evaluate('document.querySelector("#overlay").hidden'),false);
  const stopped=await evaluate("smoke.field.elapsed");
  await evaluate("smoke.frame();smoke.frame()");
  assert.equal(await evaluate("smoke.field.elapsed"),stopped);
  await click("#resume");
  await haul();
  assert.match(await text("work-order"),/crates are aboard/i);
  await click("#pause");
  await click("#withdraw");
  assert.match(await text("result-title"), /recalled/i);
  await click("#result-actions button","Retry");
  assert.equal((await liveProfile()).active.id,first.active.id);
  assert.ok(await win()>0);
  assert.match(await text("result-title"),/completed/i);
  await click("#result-actions button","Equip ");
  const equipped=(await liveProfile()).equipped;
  assert.notEqual(equipped,"dock-issue");
  await navigate("?settlement=release&bell=warn");
  assert.equal((await liveProfile()).equipped,equipped);
  await click("#launch");
  assert.match(await text("work-order"),/western winch|hand landing/i);
  await haul();
  assert.match(await text("work-order"),/rye sling reached/i);
  await click("#pause");await click("#withdraw");

  // Skip the ordinary grade climb via public progression transitions. All
  // three Deep Watch fights and both camp decisions still use the live UI.
  await evaluate(`{
    const p=SoundProgression;
    let career=p.load(localStorage);
    for(let grade=1;grade<=p.MAX_TIER;grade++) for(const site of grade===6?["quay","cut","sill"]:["quay","cut"]){
      const route=p.getContracts(career,grade).find(r=>r.site===site);
      career=p.finishRun(p.startRun(career,route.id,grade),true);
    }
    career=p.equip(career,"standing-watch");
    if(!p.save(localStorage,career))throw Error("Unable to save endgame fixture");
  }`);
  await navigate("");
  assert.equal(await evaluate('document.querySelector("#deep-panel").hidden'),false);
  await click("#deep-actions button","Take Deep Watch");
  assert.ok(await win()>0);
  assert.match(await text("deep-summary"),/Shore camp/);
  await navigate("");
  assert.match(await text("deep-summary"),/Shore camp/);
  await click("#deep-actions button","Repair");
  assert.match(await text("field-grade"),/Leg 2/);
  assert.ok(await win()>0);
  await click("#deep-actions button","Tune");
  assert.match(await text("field-grade"),/Leg 3/);
  assert.ok(await win()>0);
  assert.match(await text("deep-outcome"),/Depth 1 charted/);
  await navigate("");
  assert.match(await text("deep-record"),/Best depth 1/);
  // Build and fit an earned recipe using the same controls as a regular player.
  await click("#open-workshop");
  await click("#professions button","Shorer");
  await click("#techniques button","Split Heel");
  const recipe=await evaluate(`(() => {
    const p=SoundProgression.load(localStorage);
    const r=SoundProgression.getRecipes(p).find(r=>r.unlocked && !r.owned && r.affordable);
    if(!r)throw Error("Expected at least one affordable, uncommissioned fitting");
    return {name:r.name,id:r.id,cost:r.cost,salvage:p.salvage};
  })()`);
  await click("#recipes button",recipe.name);
  assert.equal((await liveProfile()).salvage,recipe.salvage-recipe.cost);
  await click("#locker button",recipe.name);
  await click("#return-board");
  assert.match(await text("equipped-line"),/Split Heel/);
  assert.ok((await text("equipped-line")).includes(recipe.name));

  await command("Emulation.setDeviceMetricsOverride",{
    width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844
  });
  await command("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:5});
  await navigate("");
  const cleanWidth=()=>evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) <= 390");
  assert.equal(await evaluate('matchMedia("(pointer: coarse)").matches'),true);
  assert.equal(await cleanWidth(),true,"The mobile board overflows horizontally");
  assert.equal((await liveProfile()).classId,"shorer");
  assert.equal((await liveProfile()).equipped,recipe.id);
  assert.match(await text("equipped-line"),/Split Heel/);
  await capture("mobile-board");
  await click("#launch");
  assert.equal(await evaluate("smoke.field.technique"),"split-heel");
  assert.equal(await cleanWidth(),true,"The mobile field overflows horizontally");
  // Bring the two touch controls into view together and use the real browser
  // input path. setPointerCapture() must accept both touch identifiers.
  await evaluate('document.querySelector(".controls").scrollIntoView({block:"center"})');
  const contacts=await evaluate(`(() => {
    const point=(selector, fraction, id)=>{
      const box=document.querySelector(selector).getBoundingClientRect();
      const x=box.left+box.width*fraction,y=box.top+box.height/2;
      if(!document.elementFromPoint(x,y)?.closest(selector))throw Error("Touch control offscreen: "+selector);
      return {x,y,id};
    };
    return [point("#stick",.84,1),point('#skills [data-action="primary"]',.5,2)];
  })()`);
  const startX=await evaluate("smoke.field.player.x");
  await command("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[contacts[0]]});
  await command("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:contacts});
  await evaluate("for(let i=0;i<5;i++)smoke.frame()");
  assert.ok(await evaluate("smoke.field.player.x")>startX+10,"Touch pad must move the character");
  assert.ok(await evaluate("smoke.field.player.attackCooldown")>0,"Touch action must strike while moving");
  await command("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await capture("mobile-field");
  await click("#pause");
  await click("#withdraw");
  assert.deepEqual(exceptions,[]);
  console.log("Chromium passed movement, pause, withdrawal, same-seed retry, combat, gear, techniques, craft, reload, campaign dispatches, three Deep Watch legs and a 390px touch layout.");
}

const watchdog=setTimeout(()=>child.kill("SIGKILL"),105000);
smoke().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  clearTimeout(watchdog);
  child.kill();
  // Chrome releases its profile as the process exits.
  if(child.exitCode===null && child.signalCode===null) await new Promise(done=>child.once("exit",done));
  rmSync(temporary,{recursive:true,force:true,maxRetries:4,retryDelay:150});
});
