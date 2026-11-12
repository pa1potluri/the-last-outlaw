const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright')}catch{playwright=require('C:/Users/PKP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')}
const {chromium}=playwright;
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const out=process.env.QA_OUTPUT||path.join(root,'outputs/browser-loading');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.flac':'audio/flac'};
const server=http.createServer((req,res)=>{
 if(req.url==='/host'){res.setHeader('Content-Type','text/html');return res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;overflow:hidden"><iframe id="embed" style="display:block;width:100vw;height:100vh;border:0" allow="autoplay; fullscreen" allowfullscreen src="/nested/build/index.html?mute&test"></iframe>')}
 const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\/nested\/build\//,'').replace(/^\//,'');
 if(rel==='baseline/maker/engine.html'){
  const baseline=process.env.DESKTOP_BASELINE_ENGINE?fs.readFileSync(process.env.DESKTOP_BASELINE_ENGINE):require('node:child_process').execFileSync('git',['show','12bc294:maker/engine.html'],{cwd:process.env.SOURCE_ROOT||root});
  res.setHeader('Content-Type','text/html');return res.end(baseline);
 }
 const file=path.resolve(root,rel.replace(/^baseline\//,'')||'index.html');if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(error?'Missing':data)});
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const [width,height,touch] of [[960,540,false],[1280,720,false],[740,360,true],[844,390,true],[932,430,true],[800,360,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:touch?2:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  let release;const blocked=new Promise(r=>release=r);
  await page.route('**/maker/engine.html*',async route=>{await blocked;await route.continue()});
  await page.goto(url+'/host',{waitUntil:'domcontentloaded'});
  const shell=await (await page.locator('#embed').elementHandle()).contentFrame();
  await shell.locator('#loadingText').waitFor();assert.equal(await shell.locator('#loadingText').textContent(),'Loading… 0%');
  const firstPaint=await(await context.newCDPSession(page)).send('Page.captureScreenshot');fs.writeFileSync(path.join(out,`loader-${width}.png`),Buffer.from(firstPaint.data,'base64'));
  assert.equal(await shell.locator('#loadingScreen').isVisible(),true);release();
  await shell.waitForFunction(()=>document.getElementById('loadingScreen').hidden,null,{timeout:180000});
  const game=await (await shell.locator('#game').elementHandle()).contentFrame();
  assert(await game.evaluate(()=>!loading&&titleOn&&document.getElementById('loadingBar').value===100));
  async function fit(){return game.evaluate(()=>{
   const b=cv.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,viewport:[innerWidth,innerHeight],logical:[VW,VH],scale:S,backing:[cv.width,cv.height],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
  })}
  let bounds=await fit();console.log({width,height,touch,bounds});assert(bounds.x>=-.1&&bounds.y>=-.1&&bounds.x+bounds.width<=width+.1&&bounds.y+bounds.height<=height+.1);if(touch){assert.equal(bounds.width,width);assert.equal(bounds.height,height);assert.equal(bounds.x,0);assert.equal(bounds.y,0)}else assert.equal(bounds.logical[0],1600);
  await page.screenshot({path:path.join(out,`title-${width}.png`)});
  if(touch)await game.locator('#touchNew').tap();else await page.keyboard.press('Enter');
  await game.waitForFunction(()=>!titleOn);
  if(touch)await game.locator('#touchJump').tap();else await page.keyboard.press('Space');
  await game.waitForFunction(()=>st==='play');
  // Freeze enemies only for deterministic input probes, never for campaign simulations.
  await game.evaluate(()=>{E=[];P.inv=10});
  const x=await game.evaluate(()=>P.x);
  if(touch){
   const cdp=await context.newCDPSession(page);const j=await game.locator('#joyBase').boundingBox(),s=await game.locator('#touchShoot').boundingBox();
   const finger=(id,x,y)=>({id,x,y,radiusX:3,radiusY:3});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(1,j.x+j.width/2,j.y+j.height/2),finger(2,s.x+s.width/2,s.y+s.height/2)]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger(1,j.x+j.width/2+48,j.y+j.height/2),finger(2,s.x+s.width/2,s.y+s.height/2)]});
   await game.waitForFunction(old=>P.x>old&&held('KeyJ')&&P.sprint,x);
   assert.equal(await game.locator('#touchShoot').evaluate(el=>getComputedStyle(el).opacity),'1');
   assert.equal(await game.locator('#joyBase').evaluate(el=>getComputedStyle(el).opacity),'1');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert(await game.evaluate(()=>!held('KeyD')&&!held('KeyJ')));
   await game.locator('#touchJump').tap();assert(await game.evaluate(()=>P.vz>0||P.z>0));
   // Real HUD tap, without a separate weapon button.
   await game.evaluate(()=>{GUNS=['revolver','dual'];AMMO.dual=20;gun='revolver'});
   const canvas=await game.locator('#c').boundingBox(),logical=await game.evaluate(()=>({w:VW,h:VH}));
   await page.touchscreen.tap(canvas.x+150/logical.w*canvas.width,canvas.y+150/logical.h*canvas.height);
   assert.equal(await game.evaluate(()=>gun),'dual');
   assert.equal(await game.locator('#touchGun,#touchMute,#touchInteract').count(),0);
   assert.equal(await game.locator('#touchControls button:visible').count(),2);
   for(const id of ['touchJump','touchShoot']){
    const b=await game.locator('#'+id).boundingBox();assert(b.x+b.width<=width-70||b.y+b.height<=height-70);
    assert.equal(await game.locator('#'+id).evaluate(el=>getComputedStyle(el).opacity),'0.55');
   }
   assert.equal(await game.locator('#joyBase').evaluate(el=>getComputedStyle(el).opacity),'0.55');
   await game.locator('#pauseButton').tap();assert(await game.evaluate(()=>paused));
   await game.locator('#touchSound').waitFor({state:'visible'});await page.screenshot({path:path.join(out,`pause-${width}.png`)});const wasMuted=await game.evaluate(()=>muted);
   await game.locator('#touchSound').tap();assert.equal(await game.evaluate(()=>muted),!wasMuted);assert(await game.evaluate(()=>paused));
   await game.locator('#touchResume').tap();assert.equal(await game.evaluate(()=>paused),false);
   // Mission HUD preserves interactions after removal of the Use button.
   await game.evaluate(()=>{start(1);st='play';E.forEach(e=>e.hp=0);P.x=OBJ[0].x;P.l=OBJ[0].lane});
   await page.touchscreen.tap(canvas.x+150/logical.w*canvas.width,canvas.y+308/logical.h*canvas.height);
   assert(await game.evaluate(()=>OBJ[0].done));
  }else{await page.keyboard.down('d');await page.keyboard.down('j');await game.waitForFunction(old=>P.x>old,x);await page.keyboard.up('d');await page.keyboard.up('j');await page.keyboard.press('p');assert(await game.evaluate(()=>paused));await page.keyboard.press('p')}
  await page.screenshot({path:path.join(out,`play-${width}.png`)});
  // Resize the actual outer embed as fullscreen would, then fit again.
  await page.setViewportSize({width:1920,height:1080});await game.waitForFunction(()=>innerWidth===1920);bounds=await fit();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=1920.1&&bounds.y+bounds.height<=1080.1);
  await page.locator('#embed').evaluate(el=>el.requestFullscreen());assert(await page.evaluate(()=>!!document.fullscreenElement));
  await game.waitForFunction(()=>innerWidth>0&&innerHeight>0);bounds=await fit();assert(bounds.x>=-.1&&bounds.y>=-.1&&bounds.x+bounds.width<=bounds.viewport[0]+.1&&bounds.y+bounds.height<=bounds.viewport[1]+.1);
  await page.evaluate(()=>document.exitFullscreen());
  // Exercise every scene and its renderer through the shipped engine.
  await game.evaluate(()=>{for(let i=0;i<15;i++){start(i);st='play';draw()}});
  if(width===1280&&fs.existsSync(path.join(root,'tests/browser-combat-simulation.js'))){
   const campaigns=[];
   for(const mode of ['standard','hard']){
    await game.evaluate(mode=>{difficulty=mode},mode);
    const result=await game.evaluate(fs.readFileSync(path.join(root,'tests/browser-combat-simulation.js'),'utf8'));
    assert.equal(result.results.length,15);assert.equal(result.results.at(-1).state,'end');campaigns.push({mode,...result});
   }
   fs.writeFileSync(path.join(out,'campaign-loading-results.json'),JSON.stringify(campaigns,null,2));
  }
  assert.deepEqual(errors,[]);results.push({width,height,touch,loading:true,input:true,allLevels:true,fullscreenFit:bounds,errors});await context.close();
 }

 // Interrupted touch gestures and portrait rotation must not leave held controls.
 const edgeContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const edge=await edgeContext.newPage(),edgeErrors=[];
 edge.on('pageerror',e=>edgeErrors.push(e.message));
 await edge.goto(url+'/nested/build/index.html?mute');
 await edge.waitForFunction(()=>document.getElementById('loadingScreen').hidden,null,{timeout:180000});
 const edgeGame=await(await edge.locator('#game').elementHandle()).contentFrame();
 await edgeGame.locator('#touchDifficulty').tap();assert.equal(await edgeGame.evaluate(()=>difficulty),'hard');
 await edgeGame.locator('#touchDifficulty').tap();await edgeGame.locator('#touchNew').tap();await edgeGame.locator('#touchJump').tap();
 await edgeGame.waitForFunction(()=>st==='play');
 await edgeGame.evaluate(()=>{requestAnimationFrame=()=>0});await edge.waitForTimeout(100);
 await edgeGame.evaluate(()=>{E=[];clearInput();P.l=1;draw()});
 const edgeCDP=await edgeContext.newCDPSession(edge),jr=await edgeGame.locator('#joyBase').boundingBox();
 const point=(id,dx=0,dy=0)=>({id,x:jr.x+jr.width/2+dx,y:jr.y+jr.height/2+dy});
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(1)]});
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(1,0,-38)]});assert.equal(await edgeGame.evaluate(()=>P.l),0);
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(1,0,38)]});assert.equal(await edgeGame.evaluate(()=>P.l),1);
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(1,48)]});assert(await edgeGame.evaluate(()=>held('KeyD')&&held('ShiftLeft')));
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert(await edgeGame.evaluate(()=>joy.id===null&&touchPointers.size===0));
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(2)]});
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:2,x:400,y:80}]});assert(await edgeGame.evaluate(()=>held('KeyD')));
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await edgeGame.evaluate(()=>joy.id===null&&touchPointers.size===0));
 assert(await edgeGame.evaluate(()=>scrollX===0&&scrollY===0&&document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight));
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(3,48)]});
 await edge.setViewportSize({width:390,height:844});await edgeGame.waitForFunction(()=>touchPortrait()&&paused);
 assert(await edgeGame.locator('#rotateNotice').isVisible());assert(await edgeGame.evaluate(()=>joy.id===null&&touchPointers.size===0));
 await edgeCDP.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await edge.screenshot({path:path.join(out,'portrait-390.png')});
 await edge.setViewportSize({width:844,height:390});await edgeGame.waitForFunction(()=>!touchPortrait());
 assert(await edgeGame.evaluate(()=>paused));await edgeGame.evaluate(()=>draw());await edgeGame.locator('#touchResume').tap();
 await edgeGame.evaluate(()=>{joy.id=42;joySet('joyH','KeyD');dispatchEvent(new Event('blur'));draw()});assert(await edgeGame.evaluate(()=>paused&&joy.id===null&&touchPointers.size===0));
 await edgeGame.locator('#touchResume').tap();
 // Check real origin storage in this disposable context, separate from player saves.
 await edgeGame.evaluate(()=>{start(1);st='play';cpHit=true;bounty=3456;saveProgress();savedRun=readSave();titleOn=true;draw()});
 await edgeGame.locator('#touchContinue').tap();assert(await edgeGame.evaluate(()=>!titleOn&&lv===1&&bounty===3456&&P.x===current().checkpoint));
 await edgeGame.evaluate(()=>{st='end';draw()});await edgeGame.locator('#touchNew').tap();assert(await edgeGame.evaluate(()=>lv===0&&st==='card'));
 assert.deepEqual(edgeErrors,[]);await edgeContext.close();
 const laptop=await browser.newContext({hasTouch:true,viewport:{width:1280,height:720}});
 await laptop.addInitScript(()=>{const real=matchMedia.bind(window);window.matchMedia=q=>q==='(pointer: coarse)'?{matches:false}:real(q)});
 const laptopPage=await laptop.newPage();await laptopPage.goto(url+'/nested/build/maker/engine.html?mute&test');await laptopPage.waitForFunction(()=>window.G&&!loading,null,{timeout:180000});
 assert.equal(await laptopPage.evaluate(()=>touchDevice),false);assert.equal(await laptopPage.locator('#touchMenu').isVisible(),false);
 await laptopPage.keyboard.press('Enter');assert.equal(await laptopPage.evaluate(()=>titleOn),false);await laptop.close();
 results.push({portraitRotation:true,joystickLanes:true,pointerCancellation:true,capturedRelease:true,noScroll:true,focusLoss:true,continueAndRestart:true,finePointerLaptop:true,errors:edgeErrors});

 // Desktop output must remain byte-identical to the pre-change build.
 const desktop=await browser.newContext({viewport:{width:960,height:540}}),captures=[];
 for(const entry of ['/baseline/maker/engine.html?mute&test','/nested/build/maker/engine.html?mute&test']){
  const p=await desktop.newPage();await p.goto(url+entry);await p.waitForFunction(()=>window.G&&!loading,null,{timeout:180000});
  await p.evaluate(()=>{requestAnimationFrame=()=>0});await p.waitForTimeout(100);
  const hashes=[];
  for(const mode of ['title','play','paused']){
   await p.evaluate(mode=>{Math.random=()=>.5;performance.now=()=>1000;newCampaign();titleOn=mode==='title';st='play';time=2;shake=0;redT=0;draw.last=1000;if(mode==='paused')setPaused(true);draw()},mode);
   const shot=await p.screenshot();hashes.push(require('node:crypto').createHash('sha256').update(shot).digest('hex'));
   await p.screenshot({path:path.join(out,'desktop-'+(captures.length?'after-':'before-')+mode+'.png')});
  }
  captures.push(hashes);await p.close();
 }
 assert.deepEqual(captures[0],captures[1]);fs.writeFileSync(path.join(out,'desktop-pixel-comparison.json'),JSON.stringify({baseline:'12bc294',fixtures:['title','play','paused'],before:captures[0],after:captures[1],identical:true},null,2));await desktop.close();
 // A stalled asset preserves the root's real progress and blocks early play.
 const delayed=await browser.newPage();let finish;const stall=new Promise(r=>finish=r);let first=true;
 await delayed.route('**/sounds/*.flac',async r=>{if(first){first=false;await stall}await r.continue()});
 await delayed.goto(url+'/nested/build/index.html?mute&test',{waitUntil:'domcontentloaded'});
 await delayed.waitForFunction(()=>document.getElementById('loadingBar').value>0&&document.getElementById('loadingBar').value<100,null,{timeout:180000});
 const engine=await(await delayed.locator('#game').elementHandle()).contentFrame();
 await engine.waitForFunction(()=>window.G);await engine.evaluate(()=>inputDown({code:'Enter',repeat:false,preventDefault(){}}));assert(await engine.evaluate(()=>loading&&titleOn));
 finish();await delayed.waitForFunction(()=>document.getElementById('loadingScreen').hidden,null,{timeout:180000});await delayed.close();
 // Direct engine URLs retain their own working loader.
 const direct=await browser.newPage();await direct.goto(url+'/nested/build/maker/engine.html?mute&test');await direct.waitForFunction(()=>window.G&&!loading,null,{timeout:180000});await direct.close();
 // Failed asset stays on a useful loader with retry at the root.
 const page=await browser.newPage();await page.route('**/sounds/*.flac',r=>r.abort());await page.goto(url+'/nested/build/index.html?mute&test');await page.locator('#loadingRetry').waitFor({state:'visible',timeout:180000});assert.equal(await page.locator('#loadingText').textContent(),'Loading failed');await page.close();
 fs.writeFileSync(path.join(out,'frame-loading-results.json'),JSON.stringify({results,failedAssetRetry:true},null,2));console.log('PASS root-first paint, handoff, nested paths, fit, input, 15 scenes at all 6 sizes, desktop pixel identity, fullscreen resize, and failed-asset retry');
}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
