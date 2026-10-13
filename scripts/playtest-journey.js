async (page) => {
  const baseURL = new URL('.', page.url()).href;
  const browser = page.context().browser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const p = await context.newPage();
  p.setDefaultTimeout(7000);
  p.on('pageerror', error => errors.push(error.message));
  await p.addInitScript(() => {
    const key = 'kani-ka-kai.progress.v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1,
      collected: [true, true, true, true, true],
      best: [105, 140, 160, 180, 220],
      earnedScores: [105, 140, 160, 180, 220],
      endingSeen: true,
      muted: true,
      bubbleBank: 25,
      recipes: [{ id: 'crab-cream', acquiredAt: '2026-10-14T00:00:00.000Z', bubbles: 805, materials: ['こむぎこ', 'たまご', 'パンこ', 'あぶら', 'かにづめ'] }],
    }));
  });
  await p.goto(baseURL);
  await p.locator('#enter:not(:disabled)').waitFor();
  await p.locator('#enter').click();
  await p.locator('#journey-screen:not([hidden])').waitFor();
  if (await p.locator('[data-journey="map"], [data-journey="jobs"], [data-journey="rest"]').count() !== 3) throw Error('Post-clear choices are not the expected three actions');
  await p.screenshot({ path: 'output/playwright/journey-choices-desktop.png' });

  await p.locator('[data-journey="map"]').click();
  if (!(await p.locator('.paper-map').isVisible())) throw Error('Map did not open');
  await p.screenshot({ path: 'output/playwright/journey-map-desktop.png' });
  await p.locator('[data-journey="region-south"]').click();
  await p.getByText('ここでの仕事札は、ただいま準備中。').waitFor();
  await p.locator('#wave-transition.is-running, #wave-transition.is-fading').waitFor({ state: 'hidden' });
  await p.screenshot({ path: 'output/playwright/journey-south-preview.png' });
  await p.locator('[data-journey="map"]').click();
  await p.locator('[data-journey="region-seaside"]').click();
  await p.locator('[data-journey="job-0"]').waitFor();
  if (await p.locator('.journey-job').count() !== 5) throw Error('Local job board does not show five individual jobs');
  await p.screenshot({ path: 'output/playwright/journey-job-board.png' });

  await p.setViewportSize({ width: 390, height: 844 });
  await p.locator('[data-journey="choices"]').click();
  await p.locator('[data-journey="map"]').click();
  const mobileMap = await p.locator('.journey-paper').evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  if (mobileMap.scroll > mobileMap.width + 1) throw Error(`Mobile map overflows: ${JSON.stringify(mobileMap)}`);
  await p.screenshot({ path: 'output/playwright/journey-map-mobile.png' });
  await p.locator('[data-journey="choices"]').click();
  await p.locator('[data-journey="jobs"]').click();
  const mobileJobs = await p.locator('.journey-paper').evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  if (mobileJobs.scroll > mobileJobs.width + 1) throw Error(`Mobile job board overflows: ${JSON.stringify(mobileJobs)}`);
  await p.locator('[data-journey="job-0"]').click();
  await p.locator('#app[data-phase="playing"]').waitFor();
  const targetKind = await p.locator('.cue-specimen').first().evaluate(element => element.classList.contains('is-target') ? 'kani' : 'kai');
  const otherKind = targetKind === 'kani' ? 'kai' : 'kani';
  await p.locator(`.card[data-kind="${targetKind}"]:not(:disabled)`).first().click();
  await p.waitForTimeout(285);
  await p.locator(`.card[data-kind="${otherKind}"]:not(:disabled)`).first().click();
  await p.waitForTimeout(700);
  if (await p.locator('#score').innerText() !== '5') throw Error(`Wrong card did not subtract five; target was ${targetKind}, score is ${await p.locator('#score').innerText()}`);
  for (let index = 0; index < 10; index++) {
    await p.locator('.card[data-kind="kani"]:not(:disabled)').first().click();
    await p.waitForTimeout(285);
  }
  if (await p.locator('#score').innerText() !== '105') throw Error(`Replay result should be 105 after one miss, got ${await p.locator('#score').innerText()}`);
  await p.locator('#collect').click();
  await p.locator('#journey-screen:not([hidden])').waitFor();
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('kani-ka-kai.progress.v1')));
  if (saved.bubbleBank !== 130) throw Error(`Expected previous 25 bubbles plus 105, got ${saved.bubbleBank}`);
  if (saved.recipes[0].bubbles !== 805 || saved.collected.length !== 5 || !saved.collected.every(Boolean)) throw Error('Replay changed first-clear recipe or materials');
  if (!(await p.locator('.earned-bubbles').innerText()).includes('105')) throw Error('Per-job bubble reward is not shown');
  await p.screenshot({ path: 'output/playwright/journey-replay-result-mobile.png', fullPage: true });
  await p.locator('[data-journey="rest"]').click();
  await p.locator('#entrance:not([hidden])').waitFor();
  const afterRest = await p.evaluate(() => JSON.parse(localStorage.getItem('kani-ka-kai.progress.v1')));
  await p.reload();
  await p.locator('#enter:not(:disabled)').click();
  await p.locator('#journey-screen:not([hidden])').waitFor();
  const afterReload = await p.evaluate(() => JSON.parse(localStorage.getItem('kani-ka-kai.progress.v1')));
  const balanceText = await p.locator('.journey-balance strong').first().innerText();
  if (!balanceText.includes('130')) throw Error(`Bubble balance did not survive rest and reload: text=${balanceText}, saved=${afterRest.bubbleBank}, reloaded=${afterReload.bubbleBank}`);
  await p.screenshot({ path: 'output/playwright/journey-resume-mobile.png', fullPage: true });
  await context.close();
  if (errors.length) throw Error(errors.join('\n'));
  return { passed: true, threeChoices: true, mapAndPreview: true, fiveJobChoices: true, extraWorkBubbles: saved.bubbleBank, recipeUnchanged: true, mobileMap: mobileMap.width === mobileMap.scroll, mobileJobs: mobileJobs.width === mobileJobs.scroll, resumeAfterReload: true, errors };
}
