import { Sound } from '../audio.ts';

export const speaker = '<svg viewBox="0 0 24 24" class="speaker-icon" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor"/><path d="M16 8q5 4 0 8M19 5q8 7 0 14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
export const entranceMarkup = `
  <section id="entrance" class="entrance" aria-labelledby="entrance-title">
    <header class="entrance-top"><span>海辺の選別所</span><button id="entrance-sound" class="quiet-button" aria-pressed="false">音 あり</button></header>
    <div class="entrance-content">
      <h1 id="entrance-title">かにかかい<span>。</span></h1>
      <div class="entrance-pair">
        <button class="specimen" data-word="かに" aria-label="かにの なまえをきく"><span class="specimen-art cover-crab" aria-hidden="true"></span><span class="specimen-name">かに</span>${speaker}</button>
        <span class="or-word" aria-hidden="true">か、</span>
        <button class="specimen" data-word="かい" aria-label="かいの なまえをきく"><span class="specimen-art cover-shell"><img src="${import.meta.env.BASE_URL}assets/characters/shell-paper.png" alt="" /></span><span class="specimen-name">かい</span>${speaker}</button>
      </div>
      <button id="enter" class="primary entrance-start" disabled>係員を よんでいます…</button>
      <p id="entrance-progress" class="entrance-progress"></p><button id="entrance-book" class="book-link">レシピブック <span>↗</span></button>
    </div>

  </section>
  <div id="wave-transition" class="wave-transition" aria-hidden="true"><div class="wave-sheet"><svg viewBox="0 0 1440 1200" preserveAspectRatio="none"><defs><filter id="wave-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".3 .45" numOctaves="3" seed="8" result="grain"/><feColorMatrix in="grain" type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".3" intercept=".35"/><feFuncG type="linear" slope=".3" intercept=".35"/><feFuncB type="linear" slope=".3" intercept=".35"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="soft-light"/></filter></defs><g filter="url(#wave-paper)"><path fill="#c6cabc" d="M0 88 32 76Q99 36 165 47L200 48Q288 66 357 57L397 43Q450 9 480 24L493 39 469 49Q505 64 566 65L613 61Q714 36 784 43L831 53Q936 95 1020 67L1063 47Q1110 10 1140 25L1150 40 1120 49Q1200 77 1271 62L1318 50Q1379 32 1440 43V1200H0Z"/><path fill="#667e79" d="M0 117 53 99Q130 66 212 77L253 88Q330 100 415 66L446 61 450 75Q503 91 570 97L636 94Q739 68 815 77L853 89Q959 119 1051 86L1096 76 1099 91Q1220 120 1301 85L1340 81Q1390 67 1440 72V1200H0Z"/><path fill="#84948a" d="M0 177 39 158Q139 120 214 126L268 139Q369 165 442 134L485 121Q553 104 616 129L662 146Q773 171 864 146L904 126Q968 110 1034 128L1081 151Q1181 186 1270 151L1311 140Q1382 112 1440 129V1200H0Z"/><path fill="#a7b3a5" opacity=".6" d="M69 107Q129 82 184 88L180 93Q124 87 70 113ZM692 113Q739 94 780 102L782 107Q739 100 696 118ZM1170 115Q1224 127 1263 109L1260 116Q1220 134 1172 121Z"/></g></svg></div></div>
`;

export class Entrance {
  visible = true;
  transitioning = false;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private section = document.querySelector<HTMLElement>('#entrance')!;
  private station = document.querySelector<HTMLElement>('.station')!;
  private enterButton = document.querySelector<HTMLButtonElement>('#enter')!;
  private wave = document.querySelector<HTMLElement>('#wave-transition')!;
  private canEnter = false;
  constructor(private sound: Sound, private reveal: () => void, private begin: () => void) {
    this.station.hidden = true;
    this.enterButton.addEventListener('click', () => this.enter());
    this.section.querySelectorAll<HTMLButtonElement>('[data-word]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.transitioning) return;
        const word = button.dataset.word!;
        this.sound.unlock();
        if (!this.sound.muted) this.sound.speak(word, () => {});
        button.classList.add('speaking'); setTimeout(() => button.classList.remove('speaking'), 650);
      });
    });
  }
  setReady() { this.canEnter = true; this.enterButton.disabled = false; this.enterButton.innerHTML = 'しごとを はじめる <span>→</span>'; }
  show(resuming: boolean) {
    if (this.transitioning) return;
    this.sound.cancelSpeech(); this.visible = true;
    this.section.hidden = false; this.station.hidden = true;
    this.enterButton.innerHTML = `${resuming ? 'しごとに もどる' : 'しごとを はじめる'} <span>→</span>`;
    this.enterButton.disabled = !this.canEnter;
    this.enterButton.focus({ preventScroll: true });
  }
  private enter() {
    if (!this.canEnter || this.transitioning) return;
    this.transitioning = true; this.enterButton.disabled = true;
    this.section.inert = true; this.station.inert = true;
    this.sound.unlock(); this.sound.cancelSpeech(); this.sound.wave();
    this.wave.classList.add(this.reduced ? 'is-fading' : 'is-running');
    const coverTime = this.reduced ? 100 : 680;
    const finishTime = this.reduced ? 240 : 1700;
    setTimeout(() => {
      this.section.hidden = true; this.station.hidden = false; this.visible = false;
      this.reveal();
    }, coverTime);
    setTimeout(() => {
      this.wave.classList.remove('is-running', 'is-fading');
      this.section.inert = false; this.station.inert = false; this.transitioning = false;
      this.enterButton.disabled = false;
      this.begin();
    }, finishTime);
  }
}
