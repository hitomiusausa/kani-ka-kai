import test from 'node:test';
import assert from 'node:assert/strict';
import { Round, DURATION, STAGES } from './model.ts';
import { parseProgress, freshProgress, collectRecipe } from './storage.ts';

const seeded = () => { let n = 17; return () => { n = (n * 16807) % 2147483647; return n / 2147483647; }; };
function availableTarget(r: Round, now: number) { return r.cards.findIndex(c => c.kind === r.target && !c.collected && c.availableAt <= now); }

test('before start, after expiry, and repeated picks never add points', () => {
  const r = new Round(0, () => 0);
  assert.equal(r.pick(0, 0).type, 'ignored');
  r.start(100); const picked = availableTarget(r, 100);
  assert.equal(r.pick(picked, 100).type, 'correct');
  assert.equal(r.pick(picked, 101).type, 'ignored'); assert.equal(r.score, 10);
  assert.equal(r.pick(1, 100 + DURATION).type, 'ignored'); assert.equal(r.phase, 'result');
});
test('wrong selection subtracts five, floors at zero, and blocks repeat penalties', () => {
  const r = new Round(0, () => .9); r.start(0);
  const wrong = r.cards.findIndex(c => c.kind !== r.target);
  assert.equal(r.pick(wrong, 10).type, 'wrong');
  assert.equal(r.score, 0);
  assert.equal(r.pick(wrong, 100).type, 'ignored');
  r.pick(availableTarget(r, 100), 100);
  assert.equal(r.score, 10);
  r.pick(wrong, 700); assert.equal(r.score, 5);
  r.pick(wrong, 1400); assert.equal(r.score, 0);
  r.pick(wrong, 2100); assert.equal(r.score, 0);
  assert.equal(r.mistakes, 4);
});
test('penalties do not alter the cadence of prompt switches', () => {
  for (const [stage, period] of [[2, 4], [4, 5]]) {
    const r = new Round(stage, seeded()); r.start(0);
    const initial = r.target;
    for (let n = 0; n < period; n++) {
      const now = n * 1000;
      r.pick(availableTarget(r, now), now);
      assert.equal(r.target === initial, n < period - 1);
      const wrong = r.cards.findIndex(c => c.kind !== r.target);
      r.pick(wrong, now + 500);
    }
    assert.equal(r.score, period * 5);
  }
});
test('a penalty below goal requires earning back the bubbles before collection', () => {
  const r = new Round(0, seeded()); r.start(0);
  for (let n = 0; n < 10; n++) r.pick(availableTarget(r, n * 500), n * 500);
  assert.equal(r.reached, true);
  r.pick(r.cards.findIndex(c => c.kind !== r.target), 5000);
  assert.equal(r.score, 95); assert.equal(r.reached, false);
  r.finish(); assert.equal(r.phase, 'playing');
  r.pick(availableTarget(r, 5500), 5500);
  r.finish(); assert.equal(r.phase, 'result'); assert.equal(r.score, 105);
});
test('pause freezes time and input; resuming preserves remaining duration', () => {
  const r = new Round(0, () => 0); r.start(100); r.pause(5100);
  assert.equal(r.remaining, 25000); assert.equal(r.pick(0, 6000).type, 'ignored');
  r.tick(999999); assert.equal(r.remaining, 25000);
  r.resume(1000000); r.tick(1000100); assert.equal(r.remaining, 24900);
});
test('every stage can reach its exact goal, target switching cannot deadlock', () => {
  STAGES.forEach((stage, index) => {
    const r = new Round(index, seeded()); r.start(0);
    let now = 0;
    while (!r.reached && now < DURATION) {
      r.tick(now); const i = availableTarget(r, now);
      if (i >= 0) r.pick(i, now);
      now += 500;
    }
    assert.equal(r.score, stage.goal); assert.equal(r.reached, true);
    r.finish(); assert.equal(r.phase, 'result');
  });
});
test('goal is announced once, early finish blocked before reaching it', () => {
  const r = new Round(0, () => 0); r.start(0); r.finish(); assert.equal(r.phase, 'playing');
  let reachedCount = 0;
  for (let n = 0; n < 20; n++) { const e = r.pick(availableTarget(r, n * 300), n * 300); if (e.type === 'correct' && e.justReached) reachedCount++; }
  assert.equal(reachedCount, 1); assert.equal(r.score, 200);
});
test('level one keeps positions stable until all five correct cards are collected', () => {
  const r = new Round(0, seeded()); r.start(0);
  const original = r.cards.map(c => c.kind);
  for (let n = 0; n < 4; n++) {
    const selected = availableTarget(r, n * 300);
    const e = r.pick(selected, n * 300);
    assert.equal(e.type === 'correct' && e.shuffled, false);
    assert.deepEqual(r.cards.map(c => c.kind), original);
    assert.equal(r.cards.filter(c => c.collected).length, n + 1);
    assert.equal(r.pick(selected, n * 300 + 1).type, 'ignored');
  }
  const event = r.pick(availableTarget(r, 1200), 1200);
  assert.equal(event.type === 'correct' && event.shuffled, true);
  assert.equal(r.cards.filter(c => c.collected).length, 0);
  assert.equal(r.cards.filter(c => c.kind === 'kani').length, 5);
  assert.equal(r.pick(0, 1201).type, 'ignored');
  assert.notDeepEqual(r.cards.map(c => c.kind), original);
});
test('later stages always redeal five target cards and four alternatives, with an input guard', () => {
  for (let stage = 1; stage < 5; stage++) {
    const r = new Round(stage, seeded()); r.start(0);
    for (let n = 0; n < 35; n++) {
      const now = n * 600;
      assert.equal(r.cards.filter(c => c.kind === r.target).length, 5);
      const before = r.cards.map(c => c.kind);
      const e = r.pick(availableTarget(r, now), now);
      assert.equal(e.type === 'correct' && e.shuffled, true);
      assert.equal(r.cards.filter(c => c.kind === r.target).length, 5);
      assert.notDeepEqual(r.cards.map(c => c.kind), before);
      assert.equal(r.pick(0, now + 1).type, 'ignored');
    }
  }
});
test('saved data is validated; unknown, malformed and nonsequential progress do not unlock jobs', () => {
  assert.deepEqual(parseProgress('broken'), freshProgress());
  assert.deepEqual(parseProgress('{"version":2}'), freshProgress());
  const loaded = parseProgress(JSON.stringify({ version: 1, collected: [true, false, true, true, true], best: [100, -2, '900', null, 200], endingSeen: true, muted: true }));
  assert.deepEqual(loaded.collected, [true, false, false, false, false]);
  assert.equal(loaded.unlocked, 1); assert.equal(loaded.endingSeen, false); assert.equal(loaded.muted, true);
  assert.deepEqual(loaded.best, [100, 0, 0, 0, 200]);
});

test('old saves keep materials and recover a recipe without inventing date or bubbles', () => {
  const old = { version: 1, collected: Array(5).fill(true), best: [100,140,160,180,220], endingSeen: true, muted: true };
  const recovered = parseProgress(JSON.stringify(old));
  assert.equal(recovered.recipes.length, 1);
  assert.equal(recovered.recipes[0].acquiredAt, null);
  assert.equal(recovered.recipes[0].bubbles, null);
  assert.deepEqual(recovered.best, old.best);
  assert.equal(recovered.muted, true);
  assert.equal(parseProgress(JSON.stringify({ ...old, endingSeen: false })).recipes.length, 0);
});
test('recipe collection stores the five earned scores and first date, once only', () => {
  const p = freshProgress(); collectRecipe(p); assert.equal(p.recipes.length, 0);
  p.collected.fill(true); p.endingSeen = true; p.earnedScores = [105,140,160,180,220];
  collectRecipe(p, new Date('2026-10-13T00:00:00Z'));
  assert.equal(p.recipes[0].bubbles, 805);
  assert.equal(p.recipes[0].acquiredAt, '2026-10-13T00:00:00.000Z');
  assert.equal(p.recipes[0].materials.length, 5);
  p.earnedScores[0] = 200; collectRecipe(p, new Date('2026-10-14T00:00:00Z'));
  assert.equal(p.recipes.length, 1); assert.equal(p.recipes[0].bubbles, 805);
  assert.deepEqual(parseProgress(JSON.stringify(p)).recipes, p.recipes);
});
test('invalid recipe metadata is never trusted or used to unlock a card', () => {
  const p = { ...freshProgress(), recipes: [{ id: 'crab-cream', acquiredAt: '<script>', bubbles: -1, materials: ['bad'] }] };
  assert.deepEqual(parseProgress(JSON.stringify(p)).recipes, []);
  p.collected.fill(true); p.endingSeen = true;
  const record = parseProgress(JSON.stringify(p)).recipes[0];
  assert.equal(record.acquiredAt, null); assert.equal(record.bubbles, null);
  assert.deepEqual(record.materials, STAGES.map(s => s.item));
});
