import type { Kind } from '../game/model.ts';
export function picture(kind: Kind) {
  if (kind === 'kai') return `<svg viewBox="0 0 120 80" class="picture" aria-hidden="true"><path fill="#b5a093" d="M49 69 13 31 15 18 27 12 37 16 43 7 56 4 64 11 75 6 87 13 88 21 101 21 109 32 104 44 71 69Z"/><path fill="#d0bca9" d="M55 63 22 28 25 18 35 21 48 48 43 16 54 12 58 53 67 17 77 14 80 22 66 56 93 29 101 34 95 42 66 64Z"/><path fill="#998674" d="m48 65 25-1-3 10H52Z"/></svg>`;
  return `<svg viewBox="0 0 120 80" class="picture" aria-hidden="true"><g fill="#b56246"><path d="m24 46-16-7-6-16 13 7 8-18 9 9-5 17 11 12M93 48l13-10 10-22-18 9-3-17-11 10 5 18-7 13M29 55 11 62 4 70 22 66 39 62M30 62 15 74 34 70 45 62M85 54l20 7 11 9-22-4-16-8M83 62l19 12-19-3-13-10"/><path d="m26 42 29-7 34 8 4 15-20 12-28-2-22-13Z"/></g><path stroke="#b56246" stroke-width="5" d="M44 40 41 23M72 40l5-17"/><g fill="#f4ead7"><circle cx="41" cy="24" r="7"/><circle cx="77" cy="24" r="7"/></g><g fill="#3c332d"><circle cx="43" cy="25" r="3"/><circle cx="79" cy="25" r="3"/></g><path stroke="#4b3025" stroke-width="2" d="m48 53 17 1"/></svg>`;
}
export function parcel(mark = '?') { return `<span class="parcel" aria-hidden="true"><span>${mark}</span></span>`; }

/** Large illustrations use the paper assets; small cards deliberately keep simple silhouettes. */
export function paperPicture(kind: Kind) {
  return kind === 'kani' ? '<span class="paper-kani" aria-hidden="true"></span>' : `<img class="paper-kai" src="${import.meta.env.BASE_URL}assets/characters/shell-paper.png" alt="" />`;
}

const ingredientNames = ['flour', 'egg', 'crumbs', 'oil', 'claw'];
export function ingredient(index: number) {
  return `<img class="ingredient ingredient-${ingredientNames[index]}" src="${import.meta.env.BASE_URL}assets/ingredients/${ingredientNames[index]}.png" alt="" draggable="false" />`;
}
