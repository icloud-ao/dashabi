import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE='http://127.0.0.1:8765/practice_claude_v2.html?set=1';
const screenshots='preview-screens';
await mkdir(screenshots,{recursive:true});
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:8765/data/list.json');if(r.ok)break;}catch{}await sleep(150);}
const assert=(v,label)=>{if(!v)throw Error('FAIL: '+label);console.log('PASS: '+label)};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
async function make(width,height,scheme='light'){
 const context=await browser.newContext({viewport:{width,height},colorScheme:scheme,isMobile:width<900,hasTouch:width<900});
 const page=await context.newPage();
 page.on('pageerror',e=>{results.push('JS ERROR: '+e.message);console.error(e)});
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.locator('#qbox .stem').waitFor({timeout:20000});
 await page.waitForTimeout(220);
 return {context,page};
}
const css=(page,sel,property)=>page.locator(sel).evaluate((el,p)=>getComputedStyle(el)[p],property);
const rect=(page,sel)=>page.locator(sel).boundingBox();
async function checkNoX(page,width,label){
 const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert(scroll<=width+3,label+' has no horizontal overflow (scroll='+scroll+')');
}
try{
 // desktop right
 {
  const {page,context}=await make(1440,900);
  assert(await css(page,'#sidebar','display')==='flex','desktop sidebar visible');
  let a=await rect(page,'.app'),side=await rect(page,'#sidebar');
  assert(side.x>a.x+a.width,'sidebar initially on right');
  await checkNoX(page,1440,'desktop');
  await page.screenshot({path:screenshots+'/desktop-right-light.png'});
  await page.locator('[data-side-position="left"]').click();
  a=await rect(page,'.app');side=await rect(page,'#sidebar');
  assert(side.x+side.width<a.x,'move sidebar to left');
  await page.screenshot({path:screenshots+'/desktop-left-light.png'});
  const grip=page.locator('#sideGrip');let r=await grip.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+90);
  await page.mouse.down();
  await page.mouse.move(r.x+r.width/2+64,r.y+90,{steps:8});
  await page.mouse.up();
  const width=await page.evaluate(()=>parseInt(getComputedStyle(document.querySelector('#workspace')).getPropertyValue('--side-width')));
  assert(width>=350&&width<=440,'drag handle changes width (got '+width+')');
  await grip.dblclick();
  let reset=await page.evaluate(()=>parseInt(getComputedStyle(document.querySelector('#workspace')).getPropertyValue('--side-width')));
  assert(reset===320,'double click resets 320px');
  await page.locator('[data-side-position="right"]').click();
  await page.reload();await page.locator('#qbox .stem').waitFor();
  assert(await page.locator('#workspace').evaluate(el=>el.classList.contains('side-right')),'position survives reload');
  await page.locator('[data-side-action="toggle"]').click();
  assert(await page.locator('#workspace').evaluate(el=>el.classList.contains('side-closed')),'collapse works');
  await page.screenshot({path:screenshots+'/desktop-collapsed.png'});
  await page.locator('#btnSidebar').click();
  assert(!await page.locator('#workspace').evaluate(el=>el.classList.contains('side-closed')),'reopen works');
  const first=page.locator('#card .opts .opt').first();await first.click();
  await page.waitForTimeout(120);
  assert((await page.locator('#sidebarContent .n.ok, #sidebarContent .n.bad').count())>0,'sidebar answer result updates immediately');
  assert(await page.locator('#sideStats').innerText().then(x=>x.includes('已答')),'sidebar statistics update');
  await page.locator('#sidebarContent [data-tf="multi"]').click();
  await page.waitForTimeout(120);
  assert((await page.locator('#tchip').innerText()).includes('多选'),'type filter changes question');
  assert(await page.locator('#sidebarContent .n[aria-current="step"]').count()===1,'sidebar highlights current question');
  const beforeKey=await page.locator('#cnt').innerText();
  await page.evaluate(()=>document.activeElement?.blur());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(70);
  assert((await page.locator('#cnt').innerText())!==beforeKey,'desktop keyboard ArrowRight switches question');
  await page.locator('#btnMenu').click();
  await page.locator('#sheet [data-mode="exam"]').click();
  await page.locator('#mask').click({position:{x:5,y:5}});
  await page.locator('#card .opt').first().click();
  assert(await page.locator('#card .res').count()===0,'exam mode hides result before submission');
  page.once('dialog',dlg=>dlg.accept());
  await page.locator('#sidebarContent [data-act="submit"]').click();
  await page.waitForTimeout(130);
  assert((await page.locator('#sidebarContent .sum').innerText()).includes('已交卷'),'sidebar supports exam submission');
  await context.close();
 }
 // iPad landscape and dark theme
 {
  const {page,context}=await make(1024,768,'dark');
  assert(await css(page,'#sidebar','display')==='flex','tablet landscape uses sidebar');
  assert((await rect(page,'.card')).width>=450,'tablet card maintains reading width');
  assert(await css(page,'body','backgroundColor')==='rgb(0, 0, 0)','dark theme background matches V5');
  await checkNoX(page,1024,'tablet landscape');
  await page.screenshot({path:screenshots+'/tablet-landscape-dark.png'});
  await context.close();
 }
 // mobile portrait: bottom drawer preserved
 {
  const {page,context}=await make(390,844,'light');
  assert(await css(page,'#sidebar','display')==='none','phone portrait hides desktop sidebar');
  assert(await page.locator('#btnCard').isVisible(),'phone answer drawer button visible');
  await page.locator('#btnCard').click();
  assert(await page.locator('body').evaluate(x=>x.classList.contains('sh')),'mobile answer drawer opens');
  assert(await page.locator('#sheet [data-tf="multi"]').count()===1,'drawer has type filters');
  await page.screenshot({path:screenshots+'/phone-drawer.png'});
  await page.locator('#mask').click({position:{x:4,y:80}});
  await page.screenshot({path:screenshots+'/phone-portrait.png'});
  await checkNoX(page,390,'phone portrait');
  await context.close();
 }
 // phone landscape: keep mobile layout (height criterion)
 {
  const {page,context}=await make(844,390,'dark');
  assert(await css(page,'#sidebar','display')==='none','phone landscape remains single panel');
  await checkNoX(page,844,'phone landscape');
  await page.screenshot({path:screenshots+'/phone-landscape.png'});
  await context.close();
 }
 // desktop narrow viewport falls back
 {
  const {page,context}=await make(920,760);
  assert(await css(page,'#sidebar','display')==='none','920px narrow viewport uses original drawer');
  await checkNoX(page,920,'narrow desktop');
  await context.close();
 }
 assert(results.length===0,'no uncaught page JavaScript errors');
 await writeFile(screenshots+'/results.json',JSON.stringify({tests:results,passed:true},null,2));
 console.log('VISUAL_QA_SUCCESS');
} catch(e){
 console.error(e.stack);
 await writeFile(screenshots+'/results.json',JSON.stringify({tests:results,error:e.message,passed:false},null,2));
 process.exitCode=1;
} finally {await browser.close();server.kill();}
