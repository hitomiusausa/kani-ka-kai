import { STAGES } from './model.ts';
export interface RecipeRecord { id: 'crab-cream'; acquiredAt: string | null; bubbles: number | null; materials: string[] }
export interface Progress { version: 1; unlocked: number; collected: boolean[]; best: number[]; muted: boolean; endingSeen: boolean; earnedScores: (number | null)[]; recipes: RecipeRecord[] }
export const SAVE_KEY = 'kani-ka-kai.progress.v1';
export const freshProgress = (): Progress => ({ version: 1, unlocked: 0, collected: Array(5).fill(false), best: Array(5).fill(0), muted: false, endingSeen: false, earnedScores: Array(5).fill(null), recipes: [] });
export function parseProgress(raw: string | null): Progress {
  const fallback = freshProgress();
  if (!raw) return fallback;
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !Array.isArray(p.collected) || !Array.isArray(p.best)) return fallback;
    // Only sequentially earned materials unlock the following job.
    let run = true;
    fallback.collected = STAGES.map((_, i) => { run = run && p.collected[i] === true; return run; });
    fallback.unlocked = Math.min(4, fallback.collected.filter(Boolean).length);
    fallback.best = STAGES.map((_, i) => Number.isInteger(p.best[i]) && p.best[i] >= 0 && p.best[i] < 1_000_000 ? p.best[i] : 0);
    fallback.muted = p.muted === true;
    fallback.endingSeen = p.endingSeen === true && fallback.collected.every(Boolean);
    fallback.earnedScores = STAGES.map((_, i) => fallback.collected[i] && Number.isInteger(p.earnedScores?.[i]) && p.earnedScores[i] >= STAGES[i].goal && p.earnedScores[i] < 1_000_000 ? p.earnedScores[i] : null);
    if (fallback.endingSeen) {
      const record = Array.isArray(p.recipes) ? p.recipes.find((r: any) => r?.id === 'crab-cream') : undefined;
      const date = typeof record?.acquiredAt === 'string' && Number.isFinite(Date.parse(record.acquiredAt)) ? new Date(record.acquiredAt).toISOString() : null;
      const bubbles = Number.isInteger(record?.bubbles) && record.bubbles >= 800 && record.bubbles < 5_000_000 ? record.bubbles : null;
      fallback.recipes = [{ id: 'crab-cream', acquiredAt: date, bubbles, materials: STAGES.map(s => s.item) }];
    }
    return fallback;
  } catch { return fallback; }
}
export function loadProgress(): Progress {
  try { return parseProgress(localStorage.getItem(SAVE_KEY)); } catch { return freshProgress(); }
}
export function saveProgress(progress: Progress): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}

/** First completion is the collection record; replays never rewrite its date or score. */
export function collectRecipe(progress: Progress, now = new Date()) {
  if (!progress.endingSeen || !progress.collected.every(Boolean) || progress.recipes.some(r => r.id === 'crab-cream')) return;
  const bubbles = progress.earnedScores.every(s => s !== null) ? progress.earnedScores.reduce<number>((sum, score) => sum + (score ?? 0), 0) : null;
  progress.recipes.push({ id: 'crab-cream', acquiredAt: now.toISOString(), bubbles, materials: STAGES.map(s => s.item) });
}
