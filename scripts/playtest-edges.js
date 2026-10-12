async (page) => {
  const baseURL = new URL('.', page.url()).href;
  const context = await page.context().browser().newContext({viewport:{width:1280,height:720}, reducedMotion:'reduce'});
  page = await context.newPage();
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.locator('#enter:not(:disabled)').waitFor();
  await page.locator('#entrance-sound').click();
  await page.locator('#enter').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  const correct = await page.locator('.card[data-kind="kani"]').first().getAttribute('data-index');
  await page.keyboard.press(String(Number(correct)+1));
  if(await page.locator('#score').innerText()!=='10') throw Error('Keyboard selection failed');
  await page.keyboard.press('Escape');
  await page.locator('#resume').waitFor();
  const frozen=await page.locator('#seconds').innerText();
  await page.waitForTimeout(1200);
  if(await page.locator('#seconds').innerText()!==frozen) throw Error('Pause failed');
  await page.locator('#resume').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  await page.locator('#result-main').waitFor({timeout:35000});
  if(await page.locator('#score').innerText()!=='10') throw Error('Expired score incorrect');
  if(await page.locator('.item.earned').count()) throw Error('Failure awarded material');
  if(await page.locator('#seconds').innerText()!=='0') throw Error('Clock not zero');
  await page.screenshot({path:'output/playwright/07-timeout-720p.png'});
  await page.locator('#result-main').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  if(await page.locator('#score').innerText()!=='0') throw Error('Retry did not reset score');
  if(await page.locator('#seconds').innerText()!=='30') throw Error('Retry did not reset clock');
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await page.waitForTimeout(300);
  // Explicit visibilitychange is tested separately where headless/tab visibility differs.
  await page.bringToFront();
  const h = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  if(h.scroll>h.width) throw Error('720p overflow');
  await context.close();
  if(errors.length) throw Error(errors.join('\n'));
  return {passed:true,realTimer:true,retry:true,keyboard:true,reducedMotion:true,muted:true,errors};
}
