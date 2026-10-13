import './style.css';
import './view/station.css';
import { Round, STAGES, WORD, type Kind } from './game/model.ts';
import { loadProgress, saveProgress, collectRecipe } from './game/storage.ts';
import { Sound } from './audio.ts';
import { mountCrab } from './view/crab.ts';
import { picture, paperPicture, parcel, ingredient } from './view/icons.ts';
import { RecipeBook } from './view/recipe-book.ts';
import { Entrance, entranceMarkup, speaker } from './view/entrance.ts';

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  ${entranceMarkup}
  <div class="station" hidden>
    <header class="masthead">
      <div class="station-number">海辺の選別所</div>
      <h1><button id="home" aria-label="扉ページへもどる">かにかかい<span class="title-dot">。</span></button></h1>
      <button id="sound" class="quiet-button" aria-pressed="false">音 あり</button>
    </header>
    <section class="world" aria-label="カニの係員">
      <div class="job-note"><div class="job-note-top"><span>本日のしごと</span><span class="job-stamp" aria-hidden="true">選別</span></div><span id="stage-number">01 / 05</span><span id="stage-name"></span><span id="best"></span></div>
      <div id="crab-stage" role="img" aria-label="とぼけたカニの係員"></div>
      <div class="dispenser" aria-label="材料の取り出し口"><div class="hatch"><div class="hatch-hole" aria-hidden="true"></div><div class="hatch-flap" aria-hidden="true"></div><div class="hatch-lip" aria-hidden="true"></div><div id="delivery">${parcel('？')}</div></div></div>
    </section>
    <section class="desk">
      <div class="desk-inner">
        <div class="game-status">
          <div class="time"><span class="small-label">のこり</span><div><strong id="seconds">25</strong><span>びょう</span></div></div>
          <div id="instruction" class="instruction"></div>
          <div class="score"><span class="small-label">あつめた泡</span><div><strong id="score">0</strong><span>泡</span></div></div>
        </div>
        <div class="under-status"><span id="goal"></span><button id="pause" class="quiet-button" hidden>ひとやすみ</button></div>
        <div class="board-wrap">
          <div id="board" class="board" aria-label="選別する札"></div>
          <section id="panel" class="panel" aria-label="しごとの案内"></section>
        </div>
        <div class="below-board"><span id="reaction-text" aria-live="polite"></span><button id="collect" class="text-action" hidden>材料を うけとる →</button></div>
        <footer class="inventory"><span class="inventory-label">あつめたもの</span><div id="items" class="items"></div><div class="inventory-actions"><button id="book-toggle" class="book-link">レシピブック ↗</button><button id="jobs-toggle" class="quiet-button">しごとを えらぶ</button></div></footer>
        <nav id="jobs" class="jobs" aria-label="しごとの選択" hidden></nav>
        <div class="footnote"><span>ステージ 01 ・ 5つの しごと</span><span id="save-status">ここまでの しごとは 自動保存</span></div>
      </div>
    </section>
  </div>
  <div id="countdown" class="countdown" aria-hidden="true"></div>
  <div id="announcer" class="sr-only" role="status" aria-live="polite"></div>
`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const board = $('#board'), panel = $('#panel'), goal = $('#goal'), instruction = $('#instruction');
const buttons: HTMLButtonElement[] = [];
for (let i = 0; i < 9; i++) {
  const b = document.createElement('button');
  b.className = 'card'; b.dataset.index = String(i);
  b.innerHTML = '<span class="card-content"></span><span class="card-corner" aria-hidden="true"></span>';
  board.append(b); buttons.push(b);
}
let progress = loadProgress();
const sound = new Sound(); sound.muted = progress.muted;
const crab = mountCrab();
let round = new Round(progress.unlocked);
let renderedPhase = '';
let renderedTarget = '';
let processed = false;
let speechFallback = false;
let firstInput = true;
let lastSecond = -1;
let announcementTimer = 0;
let endingTimers: number[] = [];
let ready = false;
let ending = false;
let preparing = false;
let preparationTimer = 0;
let countdownTimers: number[] = [];
let cancelCountIn = () => {};
let lastWrittenScore = -1;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const entrance = new Entrance(sound, () => {
  // Reveal the playfield under the wave, without spending any round time.
  panel.hidden = true; board.classList.remove('inactive');
  const scale = crab.game.scale;
  scale.getParentBounds();
  scale.displaySize.setParent(scale.parentSize);
  scale.refresh();
}, () => {
  prepare(() => {
    if (round.phase === 'paused') {
      round.resume(performance.now()); renderPhase(); renderCards(performance.now());
      if (round.mode === 'listen' && !speechFallback) speakTarget();
    } else startImmediately();
    buttons.find(b => !b.disabled)?.focus({ preventScroll: true });
  });
});

function persist() {
  const ok = saveProgress(progress);
  $('#save-status').textContent = ok ? 'ここまでの しごとは 自動保存' : 'このブラウザでは 保存できません';
}
function updateSound() {
  for (const id of ['#sound', '#entrance-sound']) {
    $(id).textContent = sound.muted ? '音 なし' : '音 あり';
    $(id).setAttribute('aria-pressed', String(sound.muted));
  }
}
function say(text: string) {
  $('#reaction-text').textContent = text;
  window.clearTimeout(announcementTimer);
  announcementTimer = window.setTimeout(() => { $('#reaction-text').textContent = ''; }, 1600);
}
function announce(text: string) { $('#announcer').textContent = text; }
function stageTitle(index: number, silent = index === 2 && sound.muted) {
  return index === 2 && silent ? 'かげを さがす' : STAGES[index].title;
}
function updateStageTitle() {
  $('#stage-name').textContent = stageTitle(round.stageIndex, round.stageIndex === 2 && speechFallback);
}
function updateInventory() {
  $('#items').innerHTML = STAGES.map((s, i) => `<div class="item ${progress.collected[i] ? 'earned' : ''}" aria-label="${progress.collected[i] ? s.item : 'まだ ひみつ'}"><span class="item-art">${progress.collected[i] ? ingredient(i) : parcel('？')}</span><span>${progress.collected[i] ? s.item : '？？？'}</span></div>`).join('');
  $('#jobs').innerHTML = STAGES.map((s, i) => `<button class="job-choice ${i === round.stageIndex ? 'selected' : ''}" data-stage="${i}" ${i > progress.unlocked ? 'disabled' : ''}>${String(i + 1).padStart(2, '0')}<span>${i <= progress.unlocked ? stageTitle(i) : 'ひみつ'}</span>${progress.collected[i] ? '<small>済</small>' : ''}</button>`).join('');
  $('#jobs').querySelectorAll<HTMLButtonElement>('button').forEach(b => b.addEventListener('click', () => {
    $('#jobs').hidden = true; createRound(Number(b.dataset.stage));
  }));
}
function renderInstruction() {
  const key = `${round.target}-${round.mode}-${speechFallback}`;
  if (key === renderedTarget) return;
  renderedTarget = key;
  if (round.mode === 'listen' && !speechFallback) {
    instruction.innerHTML = `<div class="order-label">えらぶ</div><div class="order-listen"><button id="listen" class="listen-button" aria-label="お題を もういちど聞く">${speaker}<span>もういちど きく</span></button><button id="silent-fallback" class="quiet-button">かげで えらぶ</button></div>`;
    $('#listen').addEventListener('click', speakTarget);
    $('#silent-fallback').addEventListener('click', () => { speechFallback = true; updateStageTitle(); renderInstruction(); });
    instruction.setAttribute('aria-label', '声と おなじ絵を えらんでください');
  } else if (round.stageIndex === 2 && speechFallback) {
    instruction.innerHTML = `<div class="order-label">かげを さがす</div><div class="shadow-cue" aria-hidden="true">${paperPicture(round.target)}</div>`;
    instruction.setAttribute('aria-label', '影と おなじ形の絵を えらんでください');
  } else {
    instruction.innerHTML = round.mode === 'words'
      ? `<div class="order-label">えらぶ</div><div class="cue-pair">${(['kani', 'kai'] as Kind[]).map(kind => `<span class="cue-specimen ${kind === round.target ? 'is-target' : 'is-silhouette'}" aria-hidden="true">${paperPicture(kind)}</span>`).join('')}</div>`
      : `<div class="order-label">えらぶ</div><div class="order-subject"><strong>${WORD[round.target]}</strong></div>`;
    instruction.setAttribute('aria-label', `${WORD[round.target]}を えらんでください`);
  }
  instruction.classList.remove('changed'); void instruction.offsetWidth; instruction.classList.add('changed');
}
function speakTarget() {
  sound.unlock();
  sound.speak(WORD[round.target], () => { speechFallback = true; updateStageTitle(); renderInstruction(); });
}
function renderCards(now: number) {
  buttons.forEach((b, i) => {
    const card = round.cards[i];
    const key = `${card.kind}-${round.mode}-${card.version}`;
    const held = now < card.availableAt;
    // Keep old card artwork until its exit animation has completed.
    if (b.dataset.key !== key && !held) {
      b.dataset.key = key;
      b.dataset.kind = card.kind;
      b.querySelector('.card-content')!.innerHTML = round.mode === 'words' ? WORD[card.kind] : picture(card.kind);
      b.setAttribute('aria-label', `${i + 1}番 ${WORD[card.kind]}`);
    }
    b.disabled = round.phase !== 'playing' || held || card.collected;
    if (card.collected || !held) b.classList.toggle('cleared', card.collected);
    if (!held && !card.collected) b.classList.remove('picked', 'wrong');
  });
  board.classList.toggle('shuffling', round.phase === 'playing' && now < round.shuffleUntil);
}
function renderHUD() {
  const secs = Math.ceil(round.remaining / 1000);
  if (secs !== lastSecond) { $('#seconds').textContent = String(secs); lastSecond = secs; }
  if (lastWrittenScore !== round.score) { $('#score').textContent = String(round.score); lastWrittenScore = round.score; }
  $('.time').classList.toggle('urgent', secs <= 5 && round.phase === 'playing');
  goal.textContent = round.reached ? '支給できます。' : `あと ${round.stage.goal - round.score}泡`;
  goal.classList.toggle('reached', round.reached);
  $('#collect').hidden = !(round.phase === 'playing' && round.reached);
  $('#pause').hidden = round.phase !== 'playing';
  $('#jobs-toggle').hidden = round.phase === 'playing' || round.phase === 'paused';
}
function createRound(stageIndex: number, autoStart = false) {
  cancelPreparation(); clearEnding(); sound.cancelSpeech();
  round = new Round(stageIndex); processed = false; speechFallback = sound.muted;
  renderedTarget = ''; renderedPhase = ''; lastSecond = -1; lastWrittenScore = -1;
  buttons.forEach(b => { b.dataset.key = ''; b.classList.remove('picked', 'wrong', 'cleared'); b.getAnimations().forEach(a => a.cancel()); });
  $('#stage-number').textContent = `${String(stageIndex + 1).padStart(2, '0')} / 05`;
  updateStageTitle();
  $('#best').textContent = progress.best[stageIndex] ? `きろく ${progress.best[stageIndex]}泡` : '本日も、よろしく。';
  $('#delivery').innerHTML = parcel('？'); $('.dispenser').classList.remove('open');
  $('#reaction-text').textContent = ''; $('#jobs').hidden = true;
  crab.react('neutral'); updateInventory(); renderInstruction();
  renderCards(performance.now()); renderHUD(); renderPhase();
  if (autoStart) start();
}
function cancelPreparation() {
  window.clearTimeout(preparationTimer); countdownTimers.forEach(window.clearTimeout); countdownTimers = [];
  $('#countdown').textContent = ''; $('#countdown').classList.remove('countdown-pop');
  cancelCountIn(); preparing = false;
  $('.station').inert = false; board.classList.remove('preparing');
}
function prepare(begin: () => void) {
  if (!ready || preparing) return;
  if (document.hidden) { renderedPhase = ''; renderPhase(); return; }
  preparing = true; sound.unlock(); sound.cancelSpeech();
  panel.hidden = true; board.classList.remove('inactive'); board.classList.add('preparing');
  $('.station').inert = true; app.dataset.phase = 'countdown';
  announce('まもなく、しごとが はじまります。');
  cancelCountIn = sound.countIn();
  [3, 2, 1].forEach((number, index) => {
    countdownTimers.push(window.setTimeout(() => {
      if (!preparing) return;
      const counter = $('#countdown');
      counter.textContent = String(number);
      counter.classList.remove('countdown-pop'); void counter.offsetWidth; counter.classList.add('countdown-pop');
    }, index * 750));
  });
  preparationTimer = window.setTimeout(() => {
    cancelPreparation(); begin();
  }, 2550);
}
function start() {
  if (round.phase !== 'ready') return;
  prepare(startImmediately);
}
function startImmediately() {
  if (!ready) return;
  sound.unlock(); firstInput = false;
  round.start(performance.now()); renderPhase(); renderCards(performance.now());
  if (document.hidden) { round.pause(performance.now()); renderPhase(); }
  if (round.mode === 'listen' && !speechFallback) speakTarget();
  announce(`${stageTitle(round.stageIndex, speechFallback)}。${round.stage.goal}泡を あつめてください。`);
}
function focusAction() { requestAnimationFrame(() => panel.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true })); }
function renderPhase() {
  if (renderedPhase === round.phase || ending) return;
  renderedPhase = round.phase;
  board.classList.toggle('inactive', round.phase !== 'playing');
  panel.hidden = round.phase === 'playing';
  app.dataset.phase = round.phase;
  if (round.phase === 'ready') {
    const instructions = round.stageIndex === 2
      ? speechFallback ? '影と おなじ形の絵を えらびます。' : '声と おなじ絵を えらびます。'
      : round.mode === 'pictures' ? '文字と おなじ絵を えらびます。'
      : round.stageIndex === 4 ? 'お題が ときどき変わります。'
      : `「${WORD[round.target]}」の 札を えらびます。`;
    panel.innerHTML = `<span class="eyebrow">第 ${round.stageIndex + 1} 選別</span><h2>${stageTitle(round.stageIndex, speechFallback)}</h2><p>${instructions}<br>${round.stage.duration / 1000}びょうで <b>${round.stage.goal}泡</b>。</p><button id="start" class="primary" ${ready ? '' : 'disabled'}>${ready ? firstInput && !progress.collected.some(Boolean) ? 'はじめる' : 'しごとを はじめる' : '係員を よんでいます…'}<span>→</span></button><small>${round.stageIndex === 0 ? 'かにを とりきると、つぎの束へ。' : '正解すると、札が いれかわります。'}</small>`;
    $('#start').addEventListener('click', start);
  } else if (round.phase === 'paused') {
    sound.cancelSpeech();
    panel.innerHTML = '<span class="eyebrow">休憩中</span><h2>ひとやすみ。</h2><p>カニも、まっています。</p><button id="resume" class="primary">つづける <span>→</span></button>';
    $('#resume').addEventListener('click', () => prepare(() => { round.resume(performance.now()); renderPhase(); if (round.mode === 'listen' && !speechFallback) speakTarget(); }));
    focusAction();
  } else if (round.phase === 'result') showResult();
}
function showResult() {
  sound.cancelSpeech();
  if (!processed) {
    processed = true;
    progress.best[round.stageIndex] = Math.max(progress.best[round.stageIndex], round.score);
    if (round.reached) {
      if (!progress.collected[round.stageIndex]) progress.earnedScores[round.stageIndex] = round.score;
      progress.collected[round.stageIndex] = true;
      progress.unlocked = Math.max(progress.unlocked, Math.min(4, round.stageIndex + 1));
      $('.dispenser').classList.add('open');
      $('#delivery').innerHTML = ingredient(round.stageIndex);
      crab.react('reward'); sound.drop();
    } else crab.react('wrong');
    persist(); updateInventory();
  }
  const done = round.reached, all = progress.collected.every(Boolean);
  panel.innerHTML = `<span class="eyebrow">${done ? '選別完了' : 'もう ひとしごと'}</span><h2 class="result-score">${round.score}<span>泡</span></h2><p>${done ? `${round.stage.item}を 支給します。` : `あと ${round.stage.goal - round.score}泡。カニは、まっています。`}</p><div class="result-actions"><button id="result-main" class="primary">${done ? all ? 'なにが できる？' : 'つぎの しごと' : 'もういちど'}<span>→</span></button>${done ? '<button id="retry" class="quiet-button">もういちど</button>' : ''}</div><small>きろく ${progress.best[round.stageIndex]}泡</small>`;
  $('#result-main').addEventListener('click', () => {
    if (!done) createRound(round.stageIndex, true);
    else if (all) showEnding();
    else createRound(Math.min(4, round.stageIndex + 1), true);
  });
  if (done) $('#retry').addEventListener('click', () => createRound(round.stageIndex, true));
  announce(done ? `${round.score}泡。${round.stage.item}を 手に入れました。` : `${round.score}泡。もう一度 挑戦できます。`);
  focusAction();
}
function popScore(b: HTMLElement, wrong = false) {
  const box = b.getBoundingClientRect();
  const label = document.createElement('span'); label.className = `score-pop${wrong ? ' negative' : ''}`; label.textContent = wrong ? '−5泡' : '＋10泡';
  label.style.left = `${box.left + box.width / 2}px`; label.style.top = `${box.top + 12}px`;
  document.body.append(label); window.setTimeout(() => label.remove(), 700);
}
function pick(index: number) {
  if (entrance.visible || entrance.transitioning || preparing || book.visible) return;
  const event = round.pick(index, performance.now());
  if (event.type === 'ignored') return;
  sound.unlock();
  const b = buttons[index];
  if (event.type === 'wrong') {
    b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
    crab.react('wrong'); sound.wrong(); popScore(b, true);
  } else {
    b.classList.add('picked'); crab.react('correct'); sound.pop(); popScore(b);
    if (event.justReached) { say('支給口が、あきそうです。'); announce('目標に到達。材料を受け取れます。'); }
    else if (event.shuffled && round.stageIndex === 0) say('つぎの束です。');
    if (event.switched) {
      renderedTarget = ''; renderInstruction(); say('お題が かわりました。');
      if (round.mode === 'listen' && !speechFallback) speakTarget();
    }
  }
  renderHUD(); renderCards(performance.now());
}
function clearEnding() {
  endingTimers.forEach(window.clearTimeout); endingTimers = []; ending = false; panel.classList.remove('ending');
}
function showEnding() {
  sound.cancelSpeech(); ending = true; app.dataset.phase = 'ending'; panel.hidden = false; panel.classList.add('ending');
  $('#jobs-toggle').hidden = true;
  panel.innerHTML = `<span class="eyebrow">本日の支給品</span><h2 id="ending-title">なにが できるかな。</h2><div class="cooking"><div class="cooking-bags">${STAGES.map((_, i) => ingredient(i)).join('')}</div><div class="pot"><span></span><span></span><span></span></div><div class="dish"><img src="${import.meta.env.BASE_URL}assets/characters/secret-dish-paper.png" alt="" /><i class="steam s1"></i><i class="steam s2"></i><i class="steam s3"></i></div></div><p id="ending-caption">係員は、なぜか慣れています。</p><button id="ending-skip" class="quiet-button">できあがりを みる →</button>`;
  const complete = () => {
    endingTimers.forEach(window.clearTimeout); endingTimers = [];
    $('.cooking').classList.add('cooked'); $('#ending-title').textContent = 'かにクリームコロッケ。';
    $('#ending-caption').textContent = 'あついうちに、どうぞ。';
    $('#ending-skip').remove();
    const b = document.createElement('button'); b.className = 'primary'; b.textContent = 'また、ひとしごと →'; panel.append(b);
    b.addEventListener('click', () => createRound(0));
    progress.endingSeen = true; collectRecipe(progress); persist(); crab.react('reward'); sound.drop();
    const cardButton = document.createElement('button'); cardButton.id = 'view-recipe'; cardButton.className = 'book-link'; cardButton.textContent = 'レシピカードを みる ↗';
    panel.append(cardButton); cardButton.addEventListener('click', () => book.open(true));
    announce('かにクリームコロッケが完成。あついうちに、どうぞ。');
  };
  $('#ending-skip').addEventListener('click', complete, { once: true });
  endingTimers.push(window.setTimeout(() => { $('.cooking').classList.add('frying'); sound.sizzle(); }, reduced ? 150 : 1100));
  endingTimers.push(window.setTimeout(complete, reduced ? 450 : 3000));
}


const book = new RecipeBook(() => progress, () => {
  if (preparing || entrance.transitioning) return false;
  round.pause(performance.now()); renderPhase(); sound.cancelSpeech();
  return true;
});
$('#entrance-book').addEventListener('click', () => book.open());
$('#book-toggle').addEventListener('click', () => book.open());

buttons.forEach((b, i) => b.addEventListener('click', () => pick(i)));
function toggleSound() {
  sound.unlock(); sound.muted = !sound.muted; progress.muted = sound.muted; sound.cancelSpeech(); updateSound(); persist();
  if (round.mode === 'listen') {
    speechFallback = sound.muted; updateStageTitle(); renderInstruction();
    if (round.phase === 'ready') { renderedPhase = ''; renderPhase(); }
    if (!sound.muted && round.phase === 'playing') speakTarget();
  }
}
$('#sound').addEventListener('click', toggleSound);
$('#entrance-sound').addEventListener('click', toggleSound);
$('#home').addEventListener('click', () => {
  if (entrance.transitioning) return;
  round.pause(performance.now()); renderPhase();
  if (round.phase === 'result' || ending) createRound(progress.collected.every(Boolean) ? 0 : progress.unlocked);
  $('#entrance-progress').textContent = `あつめたもの ${progress.collected.filter(Boolean).length} / 5`;
  entrance.show(round.phase === 'paused');
});
$('#pause').addEventListener('click', () => { round.pause(performance.now()); renderPhase(); });
$('#collect').addEventListener('click', () => { round.finish(); renderHUD(); renderPhase(); });
$('#jobs-toggle').addEventListener('click', () => { $('#jobs').hidden = !$('#jobs').hidden; });
window.addEventListener('keydown', e => {
  if (entrance.visible || entrance.transitioning || preparing || book.visible) return;
  if (e.repeat) return;
  if (round.phase === 'playing' && /^[1-9]$/.test(e.key)) { e.preventDefault(); pick(Number(e.key) - 1); }
  if (e.key === 'Escape' && round.phase === 'playing') { round.pause(performance.now()); renderPhase(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (preparing) { cancelPreparation(); renderedPhase = ''; } round.pause(performance.now()); renderPhase(); sound.cancelSpeech(); } });
document.addEventListener('crab-ready', () => { ready = true; entrance.setReady(); if (round.phase === 'ready') { renderedPhase = ''; renderPhase(); } });
document.addEventListener('crab-load-error', () => {
  panel.innerHTML = '<h2>係員が、迷子です。</h2><p>画像を読み込めませんでした。</p><button class="primary" onclick="location.reload()">よみなおす →</button>';
});
$('#entrance-progress').textContent = progress.collected.some(Boolean) ? `あつめたもの ${progress.collected.filter(Boolean).length} / 5 ・つづきは保存されています` : '';
updateSound(); createRound(progress.collected.every(Boolean) ? 0 : progress.unlocked);
function loop(now: number) {
  round.tick(now); renderCards(now); renderHUD(); renderPhase(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
