export type Kind = 'kani' | 'kai';
export type Mode = 'words' | 'pictures' | 'listen';
export type Phase = 'ready' | 'playing' | 'paused' | 'result';
export const DURATION = 30_000;
export interface Stage { title: string; target: Kind; mode: Mode; goal: number; duration: number; item: string; mark: string }
export const STAGES: Stage[] = [
  { title: 'はじめの しごと', target: 'kani', mode: 'words', goal: 100, duration: 25_000, item: 'こむぎこ', mark: '麦' },
  { title: 'つぎの しごと', target: 'kai', mode: 'words', goal: 140, duration: 25_000, item: 'たまご', mark: '卵' },
  { title: 'みみを すます', target: 'kani', mode: 'listen', goal: 160, duration: DURATION, item: 'パンこ', mark: '粉' },
  { title: 'えを えらぶ', target: 'kai', mode: 'pictures', goal: 180, duration: DURATION, item: 'あぶら', mark: '油' },
  { title: 'かにか、かいか', target: 'kani', mode: 'words', goal: 220, duration: DURATION, item: 'かにづめ', mark: '爪' },
];
export const CARD_COUNT = 9;
export const POINTS = 10;
export const PENALTY = 5;
export const WORD: Record<Kind, string> = { kani: 'かに', kai: 'かい' };
export interface Card { kind: Kind; availableAt: number; version: number; collected: boolean }
export type Pick = { type: 'ignored' } | { type: 'wrong'; index: number } | { type: 'correct'; index: number; justReached: boolean; switched: boolean; shuffled: boolean };

/** Game rules use a monotonic clock supplied by the caller, independent of the renderer. */
export class Round {
  phase: Phase = 'ready';
  score = 0;
  mistakes = 0;
  private correctCount = 0;
  target: Kind;
  mode: Mode;
  cards: Card[] = [];
  remaining = DURATION;
  private deadline = 0;
  private dealVersion = 0;
  shuffleUntil = 0;
  private random: () => number;
  stageIndex: number;
  constructor(stageIndex: number, random = Math.random) {
    this.stageIndex = stageIndex;
    this.random = random;
    this.remaining = this.stage.duration;
    this.target = this.stage.target;
    this.mode = this.stage.mode;
    this.deal();
  }
  get stage() { return STAGES[this.stageIndex]; }
  get reached() { return this.score >= this.stage.goal; }
  private deal(availableAt = 0) {
    const other: Kind = this.target === 'kani' ? 'kai' : 'kani';
    const kinds: Kind[] = Array.from({ length: CARD_COUNT }, (_, i) => i < 5 ? this.target : other);
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    // Never leave a supposedly shuffled board in exactly the previous order.
    if (this.cards.length && kinds.every((kind, i) => kind === this.cards[i].kind)) kinds.push(kinds.shift()!);
    this.dealVersion++;
    this.cards = kinds.map(kind => ({ kind, availableAt, version: this.dealVersion, collected: false }));
    this.shuffleUntil = availableAt;
  }
  start(now: number) {
    if (this.phase !== 'ready') return;
    this.phase = 'playing'; this.deadline = now + this.stage.duration;
  }
  tick(now: number) {
    if (this.phase !== 'playing') return;
    this.remaining = Math.max(0, this.deadline - now);
    if (this.remaining === 0) this.phase = 'result';
  }
  pick(index: number, now: number, answer: Kind = this.target): Pick {
    this.tick(now);
    const card = this.cards[index];
    if (this.phase !== 'playing' || !card || card.collected || card.availableAt > now) return { type: 'ignored' };
    if (card.kind !== answer) {
      this.mistakes++; card.availableAt = now + 650;
      this.score = Math.max(0, this.score - PENALTY);
      return { type: 'wrong', index };
    }
    const reachedBefore = this.reached;
    this.score += POINTS;
    this.correctCount++;
    card.collected = true;
    let switched = false;
    // Change the spoken prompt every four picks, and mix modes every five in the final job.
    if ((this.stageIndex === 2 && this.correctCount % 4 === 0) || (this.stageIndex === 4 && this.correctCount % 5 === 0)) {
      this.target = this.target === 'kani' ? 'kai' : 'kani';
      if (this.stageIndex === 4) this.mode = this.mode === 'words' ? 'pictures' : 'words';
      switched = true;
    }
    // Beginner: finish a stable bundle. Later jobs: a balanced new bundle
    // after each correct pick. Inputs are blocked during the visible shuffle.
    const shuffled = this.stageIndex > 0 || this.cards.every(c => c.kind !== this.target || c.collected);
    if (shuffled) this.deal(now + (switched ? 450 : 260));
    return { type: 'correct', index, justReached: !reachedBefore && this.reached, switched, shuffled };
  }
  pause(now: number) {
    this.tick(now);
    if (this.phase === 'playing') { this.phase = 'paused'; }
  }
  resume(now: number) {
    if (this.phase !== 'paused') return;
    this.deadline = now + this.remaining; this.phase = 'playing';
  }
  finish() { if (this.phase === 'playing' && this.reached) this.phase = 'result'; }
}
