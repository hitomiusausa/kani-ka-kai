import './journey.css';

export const journeyMarkup = `
  <section id="journey-screen" class="journey-screen" aria-live="polite" hidden>
    <div id="journey-content" class="journey-paper"></div>
  </section>
`;

const paperArrow = '<span aria-hidden="true">→</span>';

export function chapterChoices(bubbleBank: number) {
  return `<header class="journey-heading"><span class="journey-eyebrow">はじまりの海辺の選別所</span><h2>つぎは、どうする？</h2><p>5つの しごと、おつかれさま。</p></header>
    <div class="journey-balance"><span>ためた泡</span><strong>${bubbleBank}<small>泡</small></strong></div>
    <div class="journey-choices">
      <button class="journey-choice journey-primary" data-journey="map"><span class="choice-mark" aria-hidden="true">波</span><span><b>次の場所へ 手伝いに行く</b><small>地図を ひらく</small></span>${paperArrow}</button>
      <button class="journey-choice" data-journey="jobs"><span class="choice-mark" aria-hidden="true">札</span><span><b>もう少し、ここで働く</b><small>仕事を ひとつえらぶ</small></span>${paperArrow}</button>
      <button class="journey-choice journey-quiet" data-journey="rest"><span class="choice-mark" aria-hidden="true">休</span><span><b>もうくたくた。今日はここまで</b><small>進行は 自動で保存</small></span>${paperArrow}</button>
    </div><div class="journey-utility"><button data-journey="recipe">料理カードを みる ↗</button></div>`;
}

export function mapScreen(bubbleBank: number) {
  return `<header class="journey-heading"><span class="journey-eyebrow">なんでも係の 旅地図</span><h2>つぎの場所を えらぶ</h2><p>地図の札を おしてね。</p></header>
    <div class="journey-balance"><span>ためた泡</span><strong>${bubbleBank}<small>泡</small></strong></div>
    <div class="paper-map" role="group" aria-label="仕事場の地図">
      <svg class="map-land" viewBox="0 0 800 360" aria-hidden="true">
        <path class="map-shore" d="M71 130 117 92 185 101 216 78 277 94 311 74 352 88 380 124 365 156 336 169 329 208 284 225 266 267 213 278 190 253 152 251 129 217 97 211 86 178Z"/>
        <path class="map-island" d="M498 65 540 43 583 59 616 46 659 62 680 91 658 112 622 116 603 142 562 133 531 148 505 124 480 111Z"/>
        <path class="map-route" d="M255 191 C350 252 433 221 547 111"/>
        <path class="map-wave-lines" d="M42 313c25-12 49 12 74 0s49 12 74 0m-20 25c25-12 49 12 74 0s49 12 74 0m254-15c25-12 49 12 74 0s49 12 74 0m-12 27c25-12 49 12 74 0s49 12 74 0"/>
      </svg>
      <button class="map-place map-seaside" data-journey="region-seaside"><span class="map-pin" aria-hidden="true">●</span><b>はじまりの海辺</b><small>選別所・仕事ずみ</small></button>
      <button class="map-place map-island-place" data-journey="region-south"><span class="map-pin" aria-hidden="true">●</span><b>南の島</b><small>椰子蟹の収集所</small></button>
      <span class="map-caption">潮の流れに そって。</span>
    </div>
    <footer class="journey-footer"><span>ためた泡 ${bubbleBank} 泡</span><button class="journey-back" data-journey="choices">もどる</button></footer>`;
}

export function regionPreview() {
  return `<header class="journey-heading"><span class="journey-eyebrow">南の島</span><h2>椰子蟹の収集所</h2></header>
    <div class="region-postcard" aria-hidden="true"><svg viewBox="0 0 520 210">
      <defs><filter id="cut-paper-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-color="#55452e" flood-opacity=".24"/></filter></defs>
      <g filter="url(#cut-paper-shadow)">
        <path fill="#8b9876" d="M143 127Q54 73 63 38q54 20 92 73Q119 43 144 26q23 43 18 91Q199 46 230 48q-5 46-63 81Z"/>
        <path fill="#b5b68e" d="M143 127Q70 64 63 38q50 36 83 89Q125 57 144 26q12 47 17 101Q199 62 230 48q-28 45-75 81Z" opacity=".8"/>
        <path fill="#b17d4d" d="M145 117 134 186q-2 9 10 10 11 1 12-8l4-76Z"/>
        <path fill="#d3ae73" d="m145 117 8 0-8 72q-1 5-5 4Z" opacity=".75"/>
        <path fill="#a7794e" d="M96 165q20-30 44-7 17-20 34 1l15 26H79Z"/>
        <path fill="#dfbf87" d="M106 163q20-26 34-5 14-15 27 1l11 19H93Z"/>
        <path fill="#ad573e" d="M335 134q18-17 38 0l-5 21q-17 10-34 0Z"/>
        <path fill="#c87551" d="M342 136q12-9 25 0l-4 14q-10 6-21 0Z"/>
        <path fill="none" stroke="#974b39" stroke-width="8" stroke-linecap="round" d="m338 151-25 23m53-23 23 19m-69-11-21 6m77-6 23 3m-99 8-15 12m109-11 15 10"/>
        <path fill="#d89954" d="M316 126q-14-14-25-5l4 17q10 8 22-1m70-11q15-14 25-4l-4 17q-10 8-22 0"/>
        <path fill="#eee0bb" d="M306 124q-8-7-12-2l3 9 11 3m75-9q8-7 12-2l-3 9-11 3"/>
      </g>
      <path fill="#fff9e9" opacity=".15" d="M0 0h520v210H0z"/>
    </svg></div>
    <p class="region-note">椰子蟹の手伝いで、ヤシの実を拾う場所。</p>
    <p class="region-status">ここでの仕事札は、ただいま準備中。</p>
    <div class="journey-actions"><button class="journey-back" data-journey="map">地図へ もどる</button></div>`;
}

export function jobBoard(labels: string[], best: number[], bubbleBank: number) {
  return `<header class="journey-heading"><span class="journey-eyebrow">はじまりの海辺の選別所</span><h2>どの仕事を する？</h2><p>ひとつえらぶと、その仕事を1回あそべるよ。</p></header>
    <div class="journey-balance compact"><span>ためた泡</span><strong>${bubbleBank}<small>泡</small></strong></div>
    <div class="job-board-list">${labels.map((label, i) => `<button class="journey-job" data-journey="job-${i}"><span class="job-index">${String(i + 1).padStart(2, '0')}</span><span class="job-title">${label}</span><small>${best[i] ? `記録 ${best[i]}泡` : '記録なし'}</small>${paperArrow}</button>`).join('')}</div>
    <footer class="journey-footer"><span>仕事が おわると泡が たまります。</span><button class="journey-back" data-journey="choices">もどる</button></footer>`;
}

export function extraWorkResult(earned: number, bubbleBank: number) {
  return `<header class="journey-heading"><span class="journey-eyebrow">ひと仕事、おしまい</span><h2>おつかれさま。</h2><p>今回の仕事で ためた泡</p></header>
    <div class="earned-bubbles">＋${earned}<small>泡</small></div>
    <div class="journey-balance"><span>ためた泡</span><strong>${bubbleBank}<small>泡</small></strong></div>
    <div class="journey-choices">
      <button class="journey-choice journey-primary" data-journey="jobs"><span class="choice-mark" aria-hidden="true">札</span><span><b>もうひと仕事</b><small>次の仕事を えらぶ</small></span>${paperArrow}</button>
      <button class="journey-choice" data-journey="map"><span class="choice-mark" aria-hidden="true">地</span><span><b>地図を みる</b><small>仕事場を えらぶ</small></span>${paperArrow}</button>
      <button class="journey-choice journey-quiet" data-journey="rest"><span class="choice-mark" aria-hidden="true">休</span><span><b>今日はここまで</b><small>進行は 自動で保存</small></span>${paperArrow}</button>
    </div>`;
}
