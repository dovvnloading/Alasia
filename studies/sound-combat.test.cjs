const test = require('node:test');
const assert = require('node:assert/strict');
const Combat = require('./sound-combat.js');

function trial(classId = 'shorer', extra = {}) {
  return Combat.createEncounter({ seed: 1194, ...extra, build: { classId, ...extra.build } });
}

// Keep one ordinary opponent in place to isolate range, timing and target ownership.
function fixture(classId, options = {}) {
  const state = trial(classId, options);
  const enemy = state.enemies.find(e => e.kind === 'scout') || state.enemies[0];
  state.enemies = [enemy];
  Object.assign(enemy, { x: state.player.x + 63, y: state.player.y,
    speed: 0, timer: 90, hp: 500, maxHp: 500 });
  return { state, enemy, player: state.player };
}

function advance(state, seconds, input = {}) {
  for (let n = 0; n < Math.round(seconds * 60); n++) Combat.step(state, input, 1 / 60);
}

test('a seeded ticket reproduces placements, later waves and fixed-tick input', () => {
  const a = trial(), b = trial(), varied = trial('shorer', { seed: 1195 });
  assert.deepEqual(a.enemies, b.enemies);
  assert.notDeepEqual(a.enemies, varied.enemies);
  const command = { x: .3, y: .55, primary: true };
  for (let i = 0; i < 60; i++) Combat.step(a, command, 1 / 30);
  for (let i = 0; i < 120; i++) Combat.step(b, command, 1 / 60);
  assert.deepEqual(a, b);
});

test('evade follows the movement axis, buffers and cannot be chained by holding it', () => {
  const { state, player } = fixture('shorer');
  const start = player.x;
  Combat.step(state, { x: -1, dodge: true });
  assert.ok(player.x < start && player.invulnerable > 0);
  advance(state, 2, { dodge: true });
  assert.equal(player.dodgeCooldown, 0);
  assert.equal(state.audioCues.filter(cue => cue.type === 'dodge').length, 1);
  Combat.step(state, {}); Combat.step(state, { dodge: true });
  assert.ok(player.dodgeCooldown > 1);
  assert.ok(player.x >= Combat.BANK.left);
});

test('a seated Shorer catches an incoming marked eruption, earns load and spends it on a shear', () => {
  const { state, enemy, player } = fixture('shorer');
  Combat.step(state, { tool: true });
  assert.equal(state.stakes.length, 1);
  Object.assign(enemy, { mode: 'windup', timer: 0, duration: 1, action: 'strike',
    actionName: 'Test stroke', shapes: [{ type: 'disc', x: player.x, y: player.y, radius: 40 }] });
  Combat.step(state);
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.resource, 36);
  assert.equal(state.stakes.length, 0);
  Combat.step(state, { skill: true });
  assert.equal(player.resource, 8);
  assert.ok(enemy.hp < 500);
});

test('Sounder readings belong to the struck enemy and answering a tell opens that enemy', () => {
  const { state, enemy, player } = fixture('sounder');
  Object.assign(enemy, { mode: 'windup', timer: 2, duration: 2 });
  Combat.step(state, { primary: true });
  assert.equal(enemy.reading, 40);
  assert.equal(player.resource, 40);
  player.angle = Math.PI;
  assert.equal(Combat.spendHint(state), 'Aim at a read target');
  Combat.step(state, { skill: true, aimX: player.x-90, aimY: player.y });
  assert.equal(enemy.reading, 40);
  Combat.step(state, { skill: true, aimX: enemy.x, aimY: enemy.y });
  assert.equal(enemy.reading, 12);
  assert.equal(enemy.mode, 'recover');
  advance(state, 6.1);
  assert.equal(enemy.reading, 0);
  assert.equal(player.resource, 0);
});

test('a Linewright can reel a stationary target by moving, then snap the live edge', () => {
  const { state, enemy, player } = fixture('linewright');
  Combat.step(state, { primary: true });
  assert.equal(state.nodes[0].enemy, enemy.id);
  const start = player.resource;
  advance(state, .5, { x: -1 });
  assert.ok(player.resource >= start + 15);
  const hp = enemy.hp;
  Combat.step(state, { skill: true });
  assert.ok(enemy.hp < hp);
  assert.equal(state.nodes.length, 0);
});

test('the only deep-watch modifiers in effect are the active pair and recovery health carries between watches', () => {
  const normal = trial(), deep = trial('shorer', { modifier:'haste', secondaryModifier:'surge',
    currentHealthRatio:.43, watchDepth:6 });
  assert.equal(deep.player.hp, 43);
  assert.deepEqual(deep.modifiers, ['haste','surge']);
  assert.equal(deep.enemies[0].speed, normal.enemies[0].speed * 1.25);
  assert.equal(deep.enemies[0].damage, normal.enemies[0].damage * 1.5);
  deep.hazardTimer = .02;
  advance(deep, .1);
  assert.equal(deep.hazards.length, 1);
  assert.equal(normal.hazards.length, 0);
  const staged = fixture('shorer', { modifier:'surge', secondaryModifier:'armored' });
  const unplated = fixture('shorer');
  for(const {state,enemy} of [staged,unplated]) { enemy.angle = Math.PI; Combat.step(state, {primary:true}); }
  assert.ok(staged.enemy.hp > unplated.enemy.hp);
});

test('functional fittings, follow-through and quickstep change their advertised actions', () => {
  const normal = fixture('shorer'), reach = fixture('shorer', {build:{style:'reach',spill:true}} );
  for(const {state,enemy,player} of [normal,reach]) { enemy.x=player.x+112; Combat.step(state,{primary:true}); }
  assert.equal(normal.enemy.hp, 500); assert.ok(reach.enemy.hp < 500);
  const extra = {...reach.enemy, id:100, x:reach.enemy.x+52, hp:500};
  reach.state.enemies.push(extra); reach.player.attackCooldown=0;
  Combat.step(reach.state,{primary:true});
  assert.equal(extra.hp, 495);
  const force = fixture('shorer', {build:{style:'force',mastery:'quickstep'}});
  force.player.resource=80; force.player.dodgeCooldown=1.35;
  Combat.step(force.state,{skill:true});
  assert.equal(force.player.resource,45);
  assert.ok(force.player.dodgeCooldown < .86);
  assert.ok(force.enemy.hp < 440);
  const follow=fixture('sounder',{build:{mastery:'followthrough'}});
  Object.assign(follow.enemy,{opened:true,mode:'recover',timer:1});
  Combat.step(follow.state,{primary:true});
  assert.equal(follow.enemy.reading,48);
  const flow=trial('shorer',{build:{style:'flow',maxHp:85}});
  Combat.step(flow,{dodge:true});
  assert.equal(flow.player.maxHp,85);
  assert.ok(flow.player.dodgeCooldown<1.06);
});

test('a marked haul pays once, in reach, and never raises health over maximum', () => {
  const {state,player}=fixture('sounder',{workOrder:{x:650,y:230,label:'Quilt hatch',doneText:'Bundles aboard'}});
  player.hp-=6;
  Combat.step(state,{interact:true});
  assert.equal(state.workOrder.done,false);
  Object.assign(player,{x:650,y:230}); Combat.step(state,{interact:true});
  assert.ok(state.workOrder.done); assert.equal(player.hp,player.maxHp);
  player.hp-=5; Combat.step(state,{interact:true}); assert.equal(player.hp,player.maxHp-5);
});

test('a loaded machine exposes a collar once per vent for all professions', () => {
  for (const id of Object.keys(Combat.CLASSES)) {
    const state=trial(id,{site:'cut'});
    state.enemies=[];state.wave=2;state.waveTime=1.5;
    Combat.step(state);
    const boss=state.enemies.find(e=>e.boss);
    Object.assign(state.player,{x:boss.x-52,y:boss.y});
    assert.equal(Combat.ventAvailable(state),false);
    Object.assign(boss,{opened:true,mode:'recover',timer:1.2});
    assert.equal(Combat.ventAvailable(state),true);
    Combat.step(state,{interact:true});const damaged=boss.hp;
    assert.ok(damaged < boss.maxHp);
    assert.equal(Combat.ventAvailable(state),false);
    Combat.step(state,{});Combat.step(state,{interact:true});assert.equal(boss.hp,damaged);
  }
});

test('a seeded formation cleared from the player entry point can be won at both ends of progression', () => {
  for(const site of ['quay','cut','sill']) for(const classId of Object.keys(Combat.CLASSES)) {
    for(const tier of [1,6]) {
      const state=trial(classId, {tier,site,modifier:tier===1?'calm':'surge',
        build:{maxHp:tier===1?100:150, power:tier===1?1:1.5}});
      let secondStroke=false, sawBoss=false;
      for(let frame=0;state.status==='active' && frame<9000;frame++){
        const p=state.player;
        const target=state.enemies.reduce((a,b)=>!a || Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?b:a,null);
        if(!target){Combat.step(state,{},1/30);continue;}
        if(target.boss){sawBoss=true;if(target.phase===2)secondStroke=true;}
        const angle=Math.atan2(target.y-p.y,target.x-p.x);
        const range=Combat.CLASSES[classId].reach*.75 + target.radius;
        const inRange=Math.hypot(target.x-p.x,target.y-p.y)<=range;
        let x=inRange?0:Math.cos(angle), y=inRange?0:Math.sin(angle);
        const threats=state.enemies.filter(e=>e.mode==='windup').flatMap(e=>e.shapes).concat(state.hazards.map(h=>h.shape));
        const danger=threats.some(shape=>Combat.intersects(shape,p,14));
        if(danger){
          let best=-Infinity;
          for(let i=0;i<16;i++){
            const a=i*Math.PI/8, dx=Math.cos(a), dy=Math.sin(a);
            const px=Math.max(55,Math.min(905,p.x+dx*90)),py=Math.max(66,Math.min(481,p.y+dy*90));
            const clear=threats.filter(shape=>Combat.intersects(shape,{x:px,y:py},14)).length;
            const score=-1000*clear+Math.hypot(px-p.x,py-p.y)-.1*Math.abs(Math.hypot(px-target.x,py-target.y)-range);
            if(score>best){best=score;x=dx;y=dy;}
          }
        }
        Combat.step(state,{x,y,aimX:target.x,aimY:target.y,primary:true,
          skill:frame%4===0,tool:frame%18===0,dodge:danger,interact:frame%12===0},1/30);
      }
      assert.equal(state.status,'victory',site+' / '+classId+' / '+tier);
      assert.ok(sawBoss&&secondStroke);
      const end=JSON.stringify(state); advance(state,1,{primary:true});assert.equal(JSON.stringify(state),end);
    }
  }
});

test('remaining in an incoming strike can end the run; paused or terminal time grants no progress', () => {
  const state=trial('sounder',{site:'cut',currentHealthRatio:.1});
  advance(state,30);
  assert.equal(state.status,'defeat');assert.equal(state.player.hp,0);assert.ok(state.lastHitCause);
  const end=state.elapsed;Combat.step(state,{primary:true},.2);assert.equal(state.elapsed,end);
});

test('cart ruts on Gauge Steps catch a Mason’s committed rush and expose its hinge', () => {
  const state=trial();
  const mason=state.enemies.find(e=>e.kind==='mason');
  state.enemies=[mason];
  Object.assign(mason,{ x:170, y:415, mode:'charge', timer:.33, actionName:'Plate rush',
    shapes:[{type:'line',x:170,y:415,angle:0,length:200,width:24}] });
  Combat.step(state);
  assert.equal(mason.mode,'recover');
  assert.equal(mason.opened,true);
  assert.ok(mason.timer>1.5);
  assert.match(state.cue,/cart ruts/);
});
