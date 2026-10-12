async (page) => {
  const baseURL=new URL('.', page.url()).href, browser=page.context().browser();
  const errors=[];
  const empty=await browser.newContext();const e=await empty.newPage();e.on('pageerror',x=>errors.push(x.message));
  await e.goto(baseURL);await e.locator('#entrance-book').click();
  if(await e.locator('.recipe-card').count())throw Error('Locked recipe visible');
  if((await e.locator('#recipe-book').innerText()).includes('コロッケ'))throw Error('Secret dish spoiled');
  await e.keyboard.press('Escape');if(await e.locator('#recipe-book').isVisible())throw Error('Book Escape failed');
  await empty.close();
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  await ctx.addInitScript(()=>localStorage.setItem('kani-ka-kai.progress.v1',JSON.stringify({version:1,collected:[true,true,true,true,true],best:[210,140,160,180,220],endingSeen:true,muted:true})));
  const p=await ctx.newPage();p.on('pageerror',x=>errors.push(x.message));await p.goto(baseURL);
  for(const removed of ['おおきな声は','かにか、かいか。それだけです。'])if((await p.locator('#entrance').innerText()).includes(removed))throw Error('Entrance copy remains');
  await p.locator('#entrance-book').click();
  await p.locator('.recipe-card img').evaluate(i=>i.decode());
  const art=await p.locator('.recipe-card img').boundingBox();
  if(!art || art.width<100 || art.height<100)throw Error('Recipe card art collapsed');
  await p.screenshot({path:'output/playwright/recipe-shelf.png'});
  await p.locator('.recipe-card').click();
  if((await p.locator('.recipe-facts').innerText()).split('記録なし').length!==3)throw Error('Legacy metadata invented');
  if(await p.locator('.recipe-materials img').count()!==5)throw Error('Collected ingredients missing');
  for(let i=0;i<4;i++){
    await p.locator(`[data-step="${i}"]`).click();
    if(await p.locator(`[data-step="${i}"]`).getAttribute('aria-pressed')!=='true')throw Error('Step state incorrect');
  }
  await p.screenshot({path:'output/playwright/recipe-detail.png',fullPage:true});
  await p.setViewportSize({width:390,height:844});
  await p.locator('#book-back').click();await p.screenshot({path:'output/playwright/recipe-mobile-shelf.png'});
  await p.locator('.recipe-card').click();await p.screenshot({path:'output/playwright/recipe-mobile-detail.png',fullPage:true});
  const dialogWidth=await p.locator('#recipe-book').evaluate(d=>({width:d.clientWidth,scroll:d.scrollWidth}));
  if(dialogWidth.scroll>dialogWidth.width+1)throw Error('Recipe mobile overflow');
  await p.locator('#book-close').click();
  await p.setViewportSize({width:1280,height:720});await p.locator('#enter:not(:disabled)').click();await p.locator('#app[data-phase=playing]').waitFor();
  if(await p.locator('.cue-specimen').count()!==2 || await p.locator('.cue-specimen.is-silhouette').count()!==1)throw Error('Comparison silhouettes missing');
  if((await p.locator('#instruction').innerText())!=='えらぶ')throw Error('Target word exposed');
  const size=await p.evaluate(()=>({height:innerHeight,content:document.documentElement.scrollHeight}));
  await p.screenshot({path:'output/playwright/recipe-game-720.png',fullPage:true});
  await p.locator('#book-toggle').click();
  if(await p.locator('#app').getAttribute('data-phase')!=='paused')throw Error('Book did not pause game');
  const seconds=await p.locator('#seconds').innerText();await p.waitForTimeout(700);
  if(await p.locator('#seconds').innerText()!==seconds)throw Error('Book spent round time');
  await p.keyboard.press('1');if(await p.locator('#score').innerText()!=='0')throw Error('Book key input leaked');
  await p.keyboard.press('Escape');await p.locator('#resume').waitFor();
  await ctx.close();if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,legacyRecovery:true,secretUntilEarned:true,steps:4,mobile:dialogWidth,game:size,illustrationOnlyCue:true,bookPauses:true,errors};
}
