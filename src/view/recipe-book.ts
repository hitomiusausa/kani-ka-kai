import type { Progress, RecipeRecord } from '../game/storage.ts';
import { ingredient } from './icons.ts';
import './recipe-book.css';

const dish = `${import.meta.env.BASE_URL}assets/characters/secret-dish-paper.png`;
const steps = [
  { title: 'いい感じに、まぜる。', text: '小麦粉と牛乳を火にかけて、かにの身も。塩こしょうで、いい感じにするかに。', items: [0, 4] },
  { title: 'かたちは、おまかせ。', text: 'いったん冷まして、ふわっと好きな形に。まるでも、ながくても、だいたい大丈夫かに。', items: [1] },
  { title: 'ころころ、じゅわっ。', text: '小麦粉、たまご、パン粉の順に、ころっと。油でこんがり揚げるかに。', items: [0, 1, 2, 3] },
  { title: 'あついうちが、しごと。', text: '好きなソースをかけて、あついうちに食べるかに！ サクサク最高！！', items: [] },
];
function dateLabel(record: RecipeRecord) {
  return record.acquiredAt ? new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(record.acquiredAt)) : '記録なし';
}
function bubbles(record: RecipeRecord) { return record.bubbles === null ? '記録なし' : `${record.bubbles}泡`; }

export class RecipeBook {
  private dialog: HTMLDialogElement;
  private opener: HTMLElement | null = null;
  get visible() { return this.dialog.open; }
  constructor(private progress: () => Progress, private beforeOpen: () => boolean) {
    this.dialog = document.createElement('dialog');
    this.dialog.id = 'recipe-book'; this.dialog.className = 'recipe-book';
    this.dialog.setAttribute('aria-labelledby', 'book-title');
    document.body.append(this.dialog);
    this.dialog.addEventListener('close', () => this.opener?.focus({ preventScroll: true }));
  }
  open(detail = false) {
    if (this.visible || !this.beforeOpen()) return;
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.dialog.showModal();
    if (detail && this.progress().recipes.length) this.renderDetail(this.progress().recipes[0]);
    else this.renderShelf();
  }
  private frame(content: string, detail = false) {
    this.dialog.innerHTML = `<header class="book-header"><div><span class="book-eyebrow">海辺の選別所 / 料理の記録</span><h2 id="book-title">レシピブック<span>。</span></h2></div><button id="book-close" class="book-close" aria-label="レシピブックをとじる">とじる ×</button></header>${detail ? '<button id="book-back" class="book-back">← カードの一覧</button>' : ''}${content}`;
    this.dialog.querySelector('#book-close')!.addEventListener('click', () => this.dialog.close());
    this.dialog.querySelector('#book-back')?.addEventListener('click', () => { this.renderShelf(); this.dialog.querySelector<HTMLButtonElement>('.recipe-card')?.focus(); });
    this.dialog.scrollTop = 0;
    this.dialog.querySelector<HTMLButtonElement>('#book-close')!.focus({ preventScroll: true });
  }
  private renderShelf() {
    const records = this.progress().recipes;
    this.frame(`<p class="book-intro">5つの しごとで、ひとつの料理。<span>${records.length} 枚</span></p><div class="recipe-shelf">${records.map(record => `<button class="recipe-card" aria-label="かにクリームコロッケのレシピカードをひらく"><span class="recipe-card-top">No. 001 <span>STAGE 01</span></span><span class="recipe-card-art"><img src="${dish}" alt="かにクリームコロッケ" /></span><span class="recipe-card-name">かにクリーム<br>コロッケ</span><span class="recipe-card-line">そとは さくっ。なかは とろっ。</span><span class="recipe-card-bottom"><span>獲得 ${bubbles(record)}</span><span>ひらく ↗</span></span></button>`).join('')}<div class="recipe-card-empty"><span>？</span><p>${records.length ? 'つぎの一皿を、ここへ。' : 'どんな料理かは、まだ ひみつ。'}</p><small>${records.length ? 'あつめた料理が 並びます。' : '5つの しごとを おえてみよう。'}</small></div></div>`);
    this.dialog.querySelectorAll<HTMLButtonElement>('.recipe-card').forEach((button, i) => button.addEventListener('click', () => this.renderDetail(records[i])));
  }
  private renderDetail(record: RecipeRecord) {
    this.frame(`<article class="recipe-detail"><div class="recipe-summary"><div class="recipe-dish"><span>No. 001 / STAGE 01</span><img src="${dish}" alt="かにクリームコロッケ" /></div><div class="recipe-facts"><p class="book-eyebrow">選別所の ごほうび</p><h3>かにクリーム<br>コロッケ</h3><dl><div><dt>あつめた日</dt><dd>${dateLabel(record)}</dd></div><div><dt>獲得した泡</dt><dd>${bubbles(record)}</dd></div></dl><p class="materials-label">あつめた材料</p><div class="recipe-materials">${record.materials.map((item, i) => `<span>${ingredient(i)}<small>${item}</small></span>`).join('')}</div></div></div><section class="clerk-recipe" aria-labelledby="recipe-guide-title"><div class="recipe-guide-heading"><h4 id="recipe-guide-title">係員の、だいたいレシピ。</h4><span>分量は、調べてほしいかに。</span></div><div class="recipe-story"><div class="recipe-clerk" aria-hidden="true"><span class="cover-crab"></span></div><div class="recipe-bubble" aria-live="polite"></div></div><div class="recipe-step-tabs" aria-label="作り方の手順">${steps.map((step, i) => `<button data-step="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${step.title}</button>`).join('')}</div></section></article>`, true);
    const select = (index: number) => {
      const step = steps[index];
      this.dialog.querySelector('.recipe-bubble')!.innerHTML = `<span class="recipe-step-number">0${index + 1} / 04</span><div class="recipe-step-art">${step.items.length ? step.items.map(ingredient).join('') : `<img src="${dish}" alt="" />`}</div><h5>${step.title}</h5><p>${step.text}</p>`;
      this.dialog.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === index)));
    };
    this.dialog.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.step))));
    select(0);
  }
}
