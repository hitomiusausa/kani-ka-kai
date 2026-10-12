async (page) => {
  const baseURL = new URL('.', page.url()).href;
  // Use a fresh context: QA must never change a player's saved materials.
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  await page.goto(baseURL);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});
  await page.reload();
  await page.locator('#enter:not(:disabled)').waitFor();
  await page.screenshot({path:'output/playwright/01-ready.png'});
  await page.locator('#enter').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  const first = page.locator('.card[data-kind="kani"]:not(:disabled)').first();
  await first.click();
  if (await page.locator('#score').innerText() !== '10') throw Error('First correct selection did not add 10 bubbles');
  await page.screenshot({path:'output/playwright/02-playing.png'});
  const wrong = page.locator('.card[data-kind="kai"]:not(:disabled)').first();
  if (await wrong.count()) { await wrong.click(); await page.screenshot({path:'output/playwright/03-annoyed.png'}); }
  if (await page.locator('#score').innerText() !== '5') throw Error('Wrong selection did not subtract five');
  await page.locator('#pause').click();
  const paused = await page.locator('#seconds').innerText();
  await page.waitForTimeout(1100);
  if (await page.locator('#seconds').innerText() !== paused) throw Error('Paused clock moved');
  if (await page.locator('.card:not(:disabled)').count()) throw Error('Paused cards clickable');
  await page.locator('#resume').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  for (let stage = 0; stage < 5; stage++) {
    if (stage === 2 && await page.locator('#show-word').count()) await page.locator('#show-word').click();
    let limit = 0;
    while (!(await page.locator('#collect').isVisible()) && limit++ < 80) {
      const target = (await page.locator('#instruction').getAttribute('aria-label')).startsWith('かい') ? 'kai' : 'kani';
      const good = page.locator(`.card[data-kind="${target}"]:not(:disabled)`).first();
      if (await good.count()) await good.click();
      else await page.waitForTimeout(70);
      await page.waitForTimeout(100);
    }
    if (limit >= 80) throw Error(`Could not finish stage ${stage+1}`);
    await page.locator('#collect').click();
    await page.locator('#result-main').waitFor();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kani-ka-kai.progress.v1')));
    if (!saved.collected[stage]) throw Error(`Material ${stage} not saved`);
    if (stage === 0) {
      await page.screenshot({path:'output/playwright/04-first-reward.png'});
      await page.locator('#home').click();
      await page.locator('#enter').click();
      await page.locator('#app[data-phase=playing]').waitFor();
    } else await page.locator('#result-main').click();
  }
  await page.waitForTimeout(3300);
  if (!(await page.locator('#ending-title').innerText()).includes('かにクリームコロッケ')) throw Error('Missing final reveal');
  const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('kani-ka-kai.progress.v1')));
  if(completed.recipes?.length !== 1 || completed.recipes[0].bubbles !== 805 || !completed.recipes[0].acquiredAt) throw Error('Recipe collection record incorrect');
  await page.locator('#view-recipe').click();
  await page.locator('#recipe-book[open]').waitFor();
  await page.locator('[data-step="3"]').click();
  if(!(await page.locator('.recipe-bubble').innerText()).includes('サクサク最高')) throw Error('Recipe steps failed');
  await page.screenshot({path:'output/playwright/recipe-new-collection.png'});
  await page.locator('#book-close').click();
  await page.screenshot({path:'output/playwright/05-complete.png'});
  await page.reload();
  await page.locator('#enter:not(:disabled)').waitFor();
  if (await page.locator('.item.earned').count() !== 5) throw Error('Progress did not survive reload');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/06-mobile-entrance.png',fullPage:true});
  await page.locator('#enter').click();
  await page.locator('#app[data-phase=playing]').waitFor();
  await page.screenshot({path:'output/playwright/06-mobile-playing.png',fullPage:true});
  const metrics = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth, buttons:[...document.querySelectorAll('.card')].map(e => ({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));
  if (metrics.scroll > metrics.width) throw Error('Horizontal overflow');
  if (metrics.buttons.some(b => b.w < 44 || b.h < 44)) throw Error('Cards too small');
  if (errors.length) throw Error(errors.join('\n'));
  await context.close();
  return {passed:true,stages:5,persisted:true,desktop:'1440x900',mobile:'390x844',errors,metrics};
}
