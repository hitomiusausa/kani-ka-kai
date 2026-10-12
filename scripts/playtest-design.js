async (page) => {
  const baseURL=new URL('.', page.url()).href;
  const browser=page.context().browser();
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{
    window.__cueStarts=[];
    const original=AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator=function(){
      const osc=original.call(this), start=osc.start;
      osc.start=function(at){window.__cueStarts.push(at);return start.call(this,at)};
      return osc;
    };
  });
  const p=await context.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(baseURL);await p.locator('#enter:not(:disabled)').waitFor();
  const begin=Date.now();await p.locator('#enter').click();
  await p.waitForTimeout(1000);
  if(!await p.locator('#wave-transition').isVisible())throw Error('Wave ended too soon');
  await p.locator('#app[data-phase=countdown]').waitFor();
  if(Date.now()-begin<1600)throw Error('Wave shorter than 1.7 seconds');
  if(await p.locator('#seconds').innerText()!=='30')throw Error('Countdown spent round time');
  const cues=await p.evaluate(()=>window.__cueStarts);
  if(cues.length!==4 || cues.slice(1).some((x,i)=>Math.abs(x-cues[i]-.75)>.01))throw Error('Four evenly spaced count sounds missing');
  await p.keyboard.press('1');
  if(await p.locator('#score').innerText()!=='0' || await p.locator('.card:not(:disabled)').count())throw Error('Countdown accepted input');
  await p.screenshot({path:'output/playwright/design-countdown.png'});
  await p.locator('#app[data-phase=playing]').waitFor();
  if(Date.now()-begin<4100)throw Error('Started before count-in completed');
  await p.screenshot({path:'output/playwright/design-playing.png'});
  if(await p.locator('.item img').count())throw Error('Unknown ingredients revealed');
  await p.locator('#pause').click();await p.locator('#resume').click();
  await p.locator('#app[data-phase=countdown]').waitFor();
  // Simulate visibility loss only to verify the cancellation branch, not real OS tab behavior.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  if(await p.locator('#app').getAttribute('data-phase')!=='paused')throw Error('Interrupted count-in did not restore pause');
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await p.locator('#resume').click();await p.locator('#app[data-phase=playing]').waitFor();
  await context.close();
  const visual=await browser.newContext({viewport:{width:1440,height:900}});
  await visual.addInitScript(()=>localStorage.setItem('kani-ka-kai.progress.v1',JSON.stringify({version:1,collected:[true,true,true,true,true],best:[210,140,160,180,220],endingSeen:true,muted:true})));
  const v=await visual.newPage();v.on('pageerror',e=>errors.push(e.message));await v.goto(baseURL);
  await v.locator('#enter:not(:disabled)').waitFor();await v.locator('#enter').click();await v.locator('#app[data-phase=playing]').waitFor();
  await v.locator('.item img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  if(await v.locator('.item.earned img').count()!==5)throw Error('Ingredient illustration missing');
  const metrics=[];
  for(const [width,height] of [[1440,900],[1280,720],[390,844],[320,700]]){
    await v.setViewportSize({width,height});await v.waitForTimeout(200);
    await v.screenshot({path:`output/playwright/design-${width}.png`,fullPage:true});
    const metric=await v.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,content:document.documentElement.scrollHeight,canvas:document.querySelector('canvas').getBoundingClientRect().width}));
    if(metric.scroll>width || metric.canvas<250)throw Error(`Layout failed at ${width}`);
    metrics.push(metric);
  }
  await visual.close();
  if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,wave1700ms:true,countIn2550ms:true,cues:cues.length,cueInterval:.75,inputGuard:true,visibilityCancellation:true,illustrations:5,metrics,errors};
}
