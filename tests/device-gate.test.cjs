// Browser regression suite. Requires Playwright and Chrome (or BROWSER_EXECUTABLE).
// Run: node tests/device-gate.test.cjs
// Optional BASELINE_ENGINE points to the previous main engine.html for pixel comparison.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const out = process.env.CHECK_OUTPUT || path.join(root, 'outputs', 'device-checks');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.flac':'audio/flac'};
const server = http.createServer((req,res) => {
 const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://local').pathname));
 if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
 const target = file.endsWith(path.sep) ? path.join(file,'index.html') : file;
 fs.readFile(target,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(err?'Not found':data)});
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url = `http://127.0.0.1:${server.address().port}`;
 const browser = await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{channel:'chrome'}),headless:true});
 try {
  const report=[];
  for (const device of [
   {name:'phone',viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true},
   {name:'phone-landscape',viewport:{width:844,height:390},screen:{width:844,height:390},isMobile:true,hasTouch:true},
   {name:'tablet',viewport:{width:1366,height:1024},screen:{width:1366,height:1024},isMobile:true,hasTouch:true}
  ]) {
   for (const entry of ['/index.html','/maker/engine.html?game=sundown_trail']) {
    const context=await browser.newContext(device),page=await context.newPage(),requests=[],errors=[];
    page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url+entry);await page.locator('#desktopOnlyNotice').waitFor();await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#desktopOnlyNotice').innerText(),'🤠 The Last Outlaw needs a keyboard. Please play on a laptop or PC.');
    assert.equal(await page.evaluate(()=>typeof window.G),'undefined');
    assert.equal(await page.locator('canvas').count(),0);
    assert.deepEqual(errors,[]);
    assert(requests.every(p=>['/index.html','/maker/engine.html','/art/_incoming/title_outlaw.webp'].includes(p)),JSON.stringify(requests));
    const rect=await page.locator('#desktopOnlyNotice').boundingBox();assert.equal(rect.width,device.viewport.width);assert.equal(rect.height,device.viewport.height);
    if(entry==='/index.html')await page.screenshot({path:path.join(out,device.name+'.png')});
    report.push({device:device.name,entry,requests});await context.close();
   }
  }
  async function desktop(name,options={},baseline){
   const context=await browser.newContext({viewport:{width:1280,height:720},...options});
   if(options.hasTouch)await context.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=q=>q==='(pointer: coarse)'?{matches:false}:original(q)});
   if(baseline)await context.route('**/maker/engine.html*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:baseline}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'/index.html');await page.waitForFunction(()=>window.G&&!loading,null,{timeout:120000});
   assert.equal(await page.locator('#desktopOnlyNotice').count(),0);
   await page.evaluate(()=>{window.requestAnimationFrame=()=>0});await page.waitForTimeout(100);
   await page.evaluate(()=>{time=2;drawTitle()});
   const shot=await page.screenshot({path:path.join(out,name+'.png')});
   await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>titleOn),false);
   await page.keyboard.down('KeyD');assert.equal(await page.evaluate(()=>K.KeyD),1);await page.keyboard.up('KeyD');
   if(name==='desktop-1280x720'){const simulation=await page.evaluate(fs.readFileSync(path.join(root,'tests/browser-combat-simulation.js'),'utf8'));fs.writeFileSync(path.join(out,'combat-simulation.json'),JSON.stringify(simulation,null,2));assert.equal(simulation.results.length,15);assert.equal(simulation.results.at(-1).state,'end');}
   assert.deepEqual(errors,[]);await context.close();return shot;
  }
  const desktopShot=await desktop('desktop-1280x720');
  if(process.env.BASELINE_ENGINE){
   const baseline=await desktop('desktop-baseline',{},fs.readFileSync(process.env.BASELINE_ENGINE,'utf8'));
   assert(desktopShot.equals(baseline),'Desktop screenshot differs from unchanged main');
   report.push({desktop:'1280x720',baselinePixels:'identical',keyboard:'passed'});
  }
  await desktop('desktop-narrow',{viewport:{width:390,height:844}});
  await desktop('touch-laptop',{hasTouch:true,isMobile:false});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log('PASS phone, landscape phone, tablet: exact notice, full screen, title art only; desktop, narrow desktop and touch laptop: game and keyboard work.');
 } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});



