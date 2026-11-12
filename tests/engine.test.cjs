// Regression checks use the actual shipped engine in a lightweight DOM host.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'maker/games/sundown_trail/game.json'), 'utf8'));
const handlers = {};
const noop = () => {};
const gradient = {addColorStop:noop};
const saved = new Map();
const context = new Proxy({}, {get:(o,k)=>k==='measureText'?s=>({width:String(s).length*13}):k==='createLinearGradient'||k==='createRadialGradient'?()=>gradient:noop,set:(o,k,v)=>(o[k]=v,true)});
const touchMode=process.env.TOUCH_TEST==='1';
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,style:{},dataset:{},getBoundingClientRect:()=>({left:0,top:0,width:120,height:120}),setAttribute:noop,setPointerCapture:noop,addEventListener:(n,f)=>handlers[id+':'+n]=f});return elements.get(id)};
const touchCodes=['Space','KeyJ'];
const buttons=touchCodes.map(code=>Object.assign(element(code),{dataset:{touch:code}}));
const cv = {style:{},getBoundingClientRect:()=>({left:0,top:0,width:sandbox.innerWidth,height:sandbox.innerHeight}),getContext:()=>context,addEventListener:(name,fn)=>handlers['canvas:'+name]=fn};
const sandbox = {URLSearchParams,console,navigator:{maxTouchPoints:touchMode?5:0},matchMedia:()=>({matches:touchMode}),getComputedStyle:()=>({getPropertyValue:()=>0}),innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>100},
 localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 location:{pathname:'/maker/engine.html',search:'?mute',origin:'http://test'},
 document:{hidden:false,documentElement:{classList:{toggle:noop}},querySelectorAll:()=>buttons,getElementById:id=>id==='c'?cv:element(id),write:noop,createElement:()=>({...cv}),addEventListener:(n,f)=>handlers['doc:'+n]=f,body:{insertAdjacentHTML:noop}},
 Image:class{constructor(){this.complete=false;this.naturalWidth=0}},
 addEventListener:(n,f)=>handlers[n]=f,requestAnimationFrame:noop,setInterval:noop,
 fetch:async()=>({ok:true,json:async()=>structuredClone(data)}),
 Audio:class{pause(){} play(){return Promise.resolve()}},
 AudioContext:class{constructor(){this.state='running';this.currentTime=0} resume(){return Promise.resolve()}},
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'art/names.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'art/muzzle.js'),'utf8'),sandbox);
const html=fs.readFileSync(path.join(root,'maker/engine.html'),'utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(match[1],sandbox);
const run=code=>vm.runInContext(code,sandbox);
const reset=i=>run(`GAME=${JSON.stringify(data)};loading=false;levelAmmo={};levelGun='revolver';AMMO={};paused=false;titleOn=false;muted=true;start(${i});st='play'`);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}

test('all fifteen levels initialize and have well-formed objective locations',()=>{
 for(let i=0;i<15;i++){reset(i);assert.equal(run('P.hp'),100);for(const o of data.levels[i].objectives){assert(o.x>160&&o.x<data.levels[i].length-160);assert(o.lane>=0&&o.lane<3)}}
});
test('rescue and supplies both block exit',()=>{reset(1);run('E.forEach(e=>e.hp=0)');assert.equal(run('canExit()'),false);run('VG.forEach(v=>v.free=1)');assert.equal(run('canExit()'),false);run('OBJ.forEach(o=>o.done=true)');assert.equal(run('canExit()'),true)});
test('bandit missions require ordinary bandits',()=>{reset(0);run('E.filter(e=>e.boss||e.guard).forEach(e=>e.hp=0)');assert.equal(run('canExit()'),false);run('E.forEach(e=>e.hp=0)');assert.equal(run('canExit()'),true)});
test('objective needs correct lane, range, grounded player and defeated leader',()=>{
 reset(1);run('P.x=OBJ[0].x;P.l=OBJ[0].lane;interactObjective()');assert.equal(run('OBJ[0].done'),false);
 run('E.forEach(e=>e.hp=0);P.l=(OBJ[0].lane+1)%3;interactObjective()');assert.equal(run('OBJ[0].done'),false);
 run('P.l=OBJ[0].lane;P.z=80;interactObjective()');assert.equal(run('OBJ[0].done'),false);
 run('P.z=0;P.x=OBJ[0].x-101;interactObjective()');assert.equal(run('OBJ[0].done'),false);
 run('P.x=OBJ[0].x;bounty=0;interactObjective();interactObjective()');assert.equal(run('OBJ[0].done'),true);assert.equal(run('bounty'),150);
});
test('airborne bullets miss grounded enemies',()=>{reset(0);run("E=[enemy(700,1,0,0)];E[0].up=1;B=[{x:700,z:500,l:1,vx:0,me:1,d:1,pierce:1,hit:[]}];updateBullets(.001)");assert.equal(run('E[0].hp'),2)});
test('rifle hits consistently at 20, 30, 60 and 120 FPS',()=>{
 for(const fps of [20,30,60,120]){reset(0);run("E=[enemy(700,1,0,0)];E[0].up=1;E[0].hp=10;B=[{x:635,z:125,l:1,vx:2600,me:1,d:3,pierce:3,hit:[]}]");for(let t=0;t<.05;t+=1/fps)run(`updateBullets(${1/fps})`);assert.equal(run('E[0].hp'),7)}
});
test('piercing impacts follow travel order rather than enemy array order',()=>{reset(0);run("E=[enemy(850,1,0,0),enemy(700,1,0,0),enemy(760,1,0,0),enemy(950,1,0,0)];E.forEach(e=>{e.up=1;e.hp=10});B=[{x:600,z:125,l:1,vx:2600,me:1,d:3,pierce:3,hit:[]}];updateBullets(.2)");assert.deepEqual(Array.from(run('E.map(e=>e.hp)')),[7,7,7,10])});
test('crate blocks a shot below its top but not above it',()=>{reset(0);run("E=[enemy(700,1,0,1)];E[0].up=0;B=[{x:500,z:60,l:1,vx:2600,me:1,d:1,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].crate.hp'),3);run("B=[{x:500,z:180,l:1,vx:2600,me:1,d:1,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].crate.hp'),3)});
test('range expires after valid impacts but cannot hit beyond its end',()=>{reset(0);run("E=[enemy(700,1,0,0)];E[0].up=1;B=[{x:600,z:125,l:1,vx:2600,left:40,me:1,d:1,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].hp'),2)});
test('enemy shots use swept collision and respect jumping',()=>{reset(0);run("E=[];P.x=700;P.z=0;P.inv=0;B=[{x:800,z:125,l:1,vx:-2600,me:0,d:24}];updateBullets(.1)");assert.equal(run('P.hp'),76);run("P.z=200;P.inv=0;B=[{x:800,z:125,l:1,vx:-2600,me:0,d:24}];updateBullets(.1)");assert.equal(run('P.hp'),76)});
test('new campaign resets stale ammunition',()=>{reset(14);run('AMMO.rifle=0;newCampaign();start(3,true)');assert.equal(run('AMMO.rifle'),14)});
test('level retry restores starting ammunition',()=>{reset(3);const initial=run('AMMO.rifle');run('AMMO.rifle=0;start(3)');assert.equal(run('AMMO.rifle'),initial)});
test('queued blast cannot cross a level boundary',()=>{reset(0);run("BR=[{x:1000,l:1,hp:2},{x:1100,l:1,hp:2}];E=[];blast(1000,1,190,3);start(1);st='play';E=[enemy(1100,1,0,0)];E[0].hp=10;tickTimers(.3)");assert.equal(run('E[0].hp'),10)});
test('a death inside a dynamite update cannot damage the restarted run',()=>{reset(0);const before=run('startId');run("E=[];BR=[];P.hp=1;P.inv=0;DY=[{x:160,l:1,z:0,vx:0,vz:0,fuse:2},{x:160,l:1,z:0,vx:0,vz:0,fuse:2}];update(.001)");assert.equal(run('startId'),before+1);assert.equal(run('P.hp'),100)});
test('gameplay timers pause and still execute in the originating level',()=>{reset(0);run("E=[];globalThis.timerFired=0;later(.1,()=>globalThis.timerFired++);setPaused(true);update(.2)");assert.equal(run('timerFired'),0);run('setPaused(false);update(.2)');assert.equal(run('timerFired'),1)});
test('checkpoint preserves objective completion and restores health',()=>{reset(1);run('OBJ[0].done=true;cpHit=true;P.hp=1;P.inv=0;hurt(1,30)');assert.equal(run('P.hp'),100);assert.equal(run('P.x'),data.levels[1].checkpoint);assert.equal(run('OBJ[0].done'),true)});
test('focus loss clears held inputs and pauses',()=>{reset(0);run('K.KeyD=1;K.Mouse=1');handlers.blur();assert.equal(run('Object.keys(K).length'),0);assert.equal(run('paused'),true)});
test('normal mode does not allow level skip',()=>{reset(0);handlers.keydown({code:'KeyN',shiftKey:true,repeat:false,preventDefault:noop});assert.equal(run('lv'),0)});
test('holding a toggle does not repeatedly mute',()=>{reset(0);run('music=1;sndLoaded=true');handlers.keydown({code:'KeyM',repeat:false,preventDefault:noop});const first=run('muted');handlers.keydown({code:'KeyM',repeat:true,preventDefault:noop});assert.equal(run('muted'),first)});
test('paused weather does not move or produce invalid coordinates',()=>{reset(1);run('WX=[{x:200,y:50,r:.5}];setPaused(true);drawWeather(.1)');assert.equal(run('WX[0].x'),200);assert.equal(run('WX[0].y'),50)});
test('ending restart prevents default Enter activation of a focused button',()=>{reset(14);run("st='end';music=1;sndLoaded=true");let prevented=false;handlers.keydown({code:'Enter',repeat:false,preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.equal(run('lv'),0);assert.equal(run('paused'),false)});
test('mixed native artwork poses face the requested direction',()=>{assert.equal(run("spriteFlip('gang_3_0.webp',-1)"),1);assert.equal(run("spriteFlip('gang_3_0.webp',1)"),-1);assert.equal(run("spriteFlip('gang_2_1.webp',-1)"),-1);assert.equal(run("spriteFlip('marshal_0.webp',-1)"),1);assert.equal(run("spriteFlip('marshal_2.webp',-1)"),-1)});
test('runners update their facing before the early movement return',()=>{reset(0);run("E=[enemy(900,1,0,0)];E[0].run=1;P.x=160;update(.001)");assert.equal(run('E[0].face'),-1)});
test('boss locks warned lanes before firing',()=>{reset(14);run("E=E.filter(e=>e.boss);P.l=0;E[0].patternClock=.8;updateBossPattern(E[0],.01);P.l=2;updateBossPattern(E[0],.8)");assert(run('B.some(b=>b.l===0)'));assert.equal(run('B.some(b=>b.l===2)'),false)});
test('late Marshal phase warns all lanes and offers a jumpable shot',()=>{reset(14);run("const boss=E.find(e=>e.boss);boss.hp=boss.maxHp*.3;boss.patternClock=.8;updateBossPattern(boss,.01)");assert.deepEqual(Array.from(run('E.find(e=>e.boss).aimLanes')),[0,1,2]);run('updateBossPattern(E.find(e=>e.boss),.8)');assert(run('B.every(b=>b.z===125)'))});
test('war wagon alternates armor and a damage window',()=>{reset(12);run('const wagon=E.find(e=>e.boss);updateBossPattern(wagon,.01)');assert.equal(run('E.find(e=>e.boss).up'),false);run('E.find(e=>e.boss).patternClock=.01;updateBossPattern(E.find(e=>e.boss),.02)');assert.equal(run('E.find(e=>e.boss).up'),true);run('updateBossPattern(E.find(e=>e.boss),1.8)');assert.equal(run('E.find(e=>e.boss).up'),false)});
test('wagon damage requires an exposed vent at the right height',()=>{reset(12);run("E=E.filter(e=>e.boss);E[0].x=700;E[0].hp=10;E[0].up=true;B=[{x:600,z:30,l:1,vx:2600,me:1,d:3,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].hp'),10);run("B=[{x:600,z:125,l:1,vx:2600,me:1,d:3,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].hp'),7);run("E[0].up=false;B=[{x:600,z:125,l:1,vx:2600,me:1,d:3,pierce:1,hit:[]}];updateBullets(.1)");assert.equal(run('E[0].hp'),7)});
test('guards announce a lane change before moving',()=>{reset(0);run('const guard=E.find(e=>e.guard);guard.l=0;P.l=2;guard.reposition=0;updateGuardLane(guard,.01)');assert.equal(run('E.find(e=>e.guard).l'),0);assert.equal(run('E.find(e=>e.guard).nextLane'),2);run('updateGuardLane(E.find(e=>e.guard),.81)');assert.equal(run('E.find(e=>e.guard).l'),2)});
test('chase uses mounted art and timeout restarts the encounter',()=>{reset(11);assert.equal(run('heroSpr()'),'hero_mounted');const before=run('startId');run('chaseLeft=.001;update(.01)');assert.equal(run('startId'),before+1);assert.equal(run('st'),'card');assert.equal(run('chaseLeft'),120)});
test('hard mode increases damage without changing standard damage',()=>{reset(0);run("difficulty='standard';P.inv=0;hurt(1,24)");assert.equal(run('P.hp'),76);run("difficulty='hard';P.inv=0;P.hp=100;hurt(1,24)");assert.equal(run('P.hp'),72);run("difficulty='standard'")});
test('resume restores checkpoint objectives, ammo, and defeated enemies',()=>{reset(1);run("cpHit=true;E[0].hp=0;OBJ[0].done=true;VG[0].free=1;AMMO.shotgun=7;bounty=1234;saveProgress();titleOn=true;start(0);resumeCampaign()");assert.equal(run('lv'),1);assert.equal(run('P.x'),data.levels[1].checkpoint);assert.equal(run('E[0].hp'),0);assert.equal(run('OBJ[0].done'),true);assert(run('VG[0].free>0'));assert.equal(run('AMMO.shotgun'),7);assert.equal(run('bounty'),1234)});
test('invalid saves fail gracefully',()=>{reset(0);saved.set('last-outlaw-fixed-v3','{bad');assert.equal(run('readSave()'),null);assert.equal(run('resumeCampaign()'),false)});
test('effect count stays bounded during long firefights',()=>{reset(0);run("for(let i=0;i<500;i++)fx({k:'dust',x:0,y:0})");assert.equal(run('FX.length'),260)});
test('every campaign level can clear once its real objectives are met',()=>{for(let i=0;i<15;i++){reset(i);run('E.forEach(e=>e.hp=0);VG.forEach(v=>v.free=1);OBJ.forEach(o=>o.done=true);P.x=len+1;update(.001)');assert.equal(run('st'),i===14?'end':'clear')}});
test('loading screen prevents keyboard and mouse from starting a campaign',()=>{
 reset(0);run('titleOn=true;loading=true');
 handlers.keydown({code:'Space',repeat:false,preventDefault:noop});handlers['canvas:mousedown']();
 assert.equal(run('titleOn'),true);run('loading=false');
});
test('asset queue includes campaign art, mounted sprites, and all six lossless sounds',()=>{
 const assets=Array.from(run('assetReferences(GAME,assetReferences(SPRS))'));
 assert(assets.includes(data.titleImage));assert(assets.includes('heroride_0.webp'));
 assert.equal(assets.filter(x=>x.endsWith('.flac')).length,6);
 assert(assets.every(x=>!x.startsWith('/')&&!/^[a-z]+:/i.test(x)));
});

test('touch holds combine with keyboard and clear independently',()=>{
 reset(0);run("K.KeyD=1;touchPointers.set(1,{code:'KeyD',button:touchButtons[0]});touchPointers.set(2,{code:'KeyJ',button:touchButtons[1]})");
 assert.equal(run("held('KeyD')&&held('KeyJ')"),true);
 run('releaseTouch({pointerId:1})');assert.equal(run("held('KeyD')"),true);
 run('clearInput()');assert.equal(run("held('KeyD')||held('KeyJ')||touchPointers.size>0"),false);
});
test('touch actions do not leave keyboard keys stuck',()=>{
 reset(0);run("music=1;sndLoaded=true;touchAction('KeyW');touchAction('Space');touchAction('KeyE')");
 assert.equal(run('P.l'),0);assert.equal(run('P.vz'),data.player.jump);assert.equal(run('Object.keys(K).length'),0);
});
if(touchMode){
 test('touch canvas fills the viewport with uniform scale',()=>{
  reset(0);sandbox.innerWidth=844;sandbox.innerHeight=390;run('resize()');
  assert.equal(cv.style.width,'844px');assert.equal(cv.style.height,'390px');
  assert.equal(run('VW/VH'),844/390);sandbox.innerWidth=1280;sandbox.innerHeight=720;run('resize()');
 });
 test('weapon HUD tap switches and pause menu sound does not resume play',()=>{
  reset(3);run('music=1;sndLoaded=true');const previous=run('gun');
  handlers['canvas:pointerdown']({pointerType:'touch',clientX:100/ run('VW')*1280,clientY:150/941*720,preventDefault:noop});assert.notEqual(run('gun'),previous);
  run('setPaused(true)');const before=run('muted');handlers['touchSound:click']();assert.notEqual(run('muted'),before);assert.equal(run('paused'),true);
  handlers['touchResume:click']();assert.equal(run('paused'),false);
 });
 test('pause clears joystick virtual keys and active pointer',()=>{
  reset(0);run("joy.id=7;joySet('joyH','KeyD');joySet('joySprint','ShiftLeft');setPaused(true)");
  assert.equal(run('joy.id'),null);assert.equal(run("held('KeyD')||held('ShiftLeft')"),false);
 });
 const press=(code,id)=>handlers[code+':pointerdown']({pointerId:id,pointerType:'touch',preventDefault:noop});
 const dragStick=id=>{
  handlers['joyZone:pointerdown']({pointerId:id,pointerType:'touch',clientX:60,clientY:60,preventDefault:noop});
  handlers['joyZone:pointermove']({pointerId:id,clientX:108,clientY:60});
 };
 test('multi-touch movement sprint and fire survive partial release',()=>{
  reset(0);run('music=1;sndLoaded=true;E=[]');dragStick(10);press('KeyJ',12);
  const x=run('P.x');run('update(.05)');assert(run('P.x')>x);assert.equal(run('P.sprint'),true);assert(run('B.length')>0);
  handlers['KeyJ:pointercancel']({pointerId:12});assert.equal(run("held('KeyJ')"),false);assert.equal(run("held('KeyD')"),true);
  handlers['joyZone:lostpointercapture']({pointerId:10});assert.equal(run("held('KeyD')"),false);run('clearInput()');
 });
 test('touch is blocked while loading or paused and rotation clears holds',()=>{
  reset(0);run('loading=true');dragStick(1);assert.equal(run('touchPointers.size'),0);
  run('loading=false;setPaused(true)');dragStick(2);assert.equal(run('touchPointers.size'),0);
  run('setPaused(false)');dragStick(3);sandbox.innerWidth=390;sandbox.innerHeight=844;run('touchOrientation()');
  assert.equal(run('paused'),true);assert.equal(run('touchPointers.size'),0);
  sandbox.innerWidth=1280;sandbox.innerHeight=720;run('touchOrientation()');assert.equal(run('paused'),true);
 });
 test('same action held by two fingers releases only after both lift',()=>{
  reset(0);press('KeyJ',40);press('KeyJ',41);handlers['KeyJ:pointerup']({pointerId:40});assert.equal(run("held('KeyJ')"),true);
  handlers['KeyJ:pointerup']({pointerId:41});assert.equal(run("held('KeyJ')"),false);
 });
}

console.log(`${passed} regression checks passed.`);
