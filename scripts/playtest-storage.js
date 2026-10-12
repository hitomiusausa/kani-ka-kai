async (page) => {
  const baseURL = new URL('.', page.url()).href;
  const browser = page.context().browser();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const native = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key,value) {
      if(key==='kani-ka-kai.progress.v1') throw new DOMException('QA: storage denied','QuotaExceededError');
      return native.call(this,key,value);
    };
  });
  const check = await context.newPage();
  await check.goto(baseURL);
  await check.locator('#enter:not(:disabled)').waitFor();
  await check.locator('#entrance-sound').click();
  if(!(await check.locator('#save-status').innerText()).includes('保存できません')) throw Error('Missing storage failure notice');
  await check.locator('#enter').click();
  await check.locator('#app[data-phase=playing]').waitFor();
  await check.locator('.card[data-kind="kani"]:not(:disabled)').first().click();
  if(await check.locator('#score').innerText()!=='10') throw Error('Unavailable storage prevented play');
  const other=await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await check.waitForTimeout(300);
  const visibility=await check.evaluate(()=>({state:document.visibilityState,phase:document.querySelector('#app').dataset.phase}));
  if(visibility.state==='hidden' && visibility.phase!=='paused') throw Error('Hidden tab did not pause');
  await context.close();
  return {passed:true,storageFailureHandled:true,playWithoutStorage:true,visibility};
}
