import Phaser from 'phaser';

const CRAB_ASSET = `${import.meta.env.BASE_URL}assets/characters/crab-expressions.png`;
export class CrabScene extends Phaser.Scene {
  private crab?: Phaser.GameObjects.Image;
  private reset?: Phaser.Time.TimerEvent;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private frameScale = 1;
  constructor() { super('clerk'); }
  preload() {
    this.load.image('clerk', CRAB_ASSET);
    this.load.once('loaderror', () => document.dispatchEvent(new Event('crab-load-error')));
  }
  create() {
    if (!this.textures.exists('clerk')) return;
    const texture = this.textures.get('clerk');
    const source = texture.getSourceImage() as HTMLImageElement;
    // The generated sheet is preserved. Runtime texture frames trim transparent
    // margins and share a bottom-center anchor and scale across all expressions.
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const cw = Math.floor(source.width / 2), ch = Math.floor(source.height / 2);
    let largest = 0;
    for (let frame = 0; frame < 4; frame++) {
      const ox = (frame % 2) * cw, oy = Math.floor(frame / 2) * ch;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;
      for (let y = 0; y < ch; y++) {
        let count = 0, left = cw, right = 0;
        for (let x = 0; x < cw; x++) {
          if (pixels[((oy + y) * source.width + ox + x) * 4 + 3] > 150) { count++; left = Math.min(left, x); right = x; }
        }
        if (count > 12) { minX = Math.min(minX, left); maxX = Math.max(maxX, right); minY = Math.min(minY, y); maxY = y; }
      }
      const w = maxX - minX + 1, h = maxY - minY + 1;
      texture.add(String(frame), 0, ox + minX, oy + minY, w, h);
      largest = Math.max(largest, w);
    }
    this.frameScale = 440 / largest;
    this.crab = this.add.image(300, 243, 'clerk', '0').setOrigin(.5, 1).setScale(this.frameScale);
    document.dispatchEvent(new Event('crab-ready'));
  }
  react(kind: 'correct' | 'wrong' | 'reward' | 'neutral') {
    if (!this.crab) return;
    this.reset?.remove();
    const frame = { neutral: 0, correct: 1, wrong: 2, reward: 3 }[kind];
    this.crab.setFrame(String(frame));
    if (kind !== 'neutral') this.reset = this.time.delayedCall(kind === 'wrong' ? 650 : kind === 'reward' ? 1000 : 170, () => this.crab?.setFrame('0'));
    if (kind === 'correct') this.bubble();
  }
  private bubble() {
    const ring = this.add.circle(300, 170, 6, 0xf7f3e9, .15).setStrokeStyle(1.5, 0xe6dfcc, .96);
    const glint = this.add.circle(298, 168, 1.3, 0xffffff, .9);
    const bubble = this.add.container(0, 0, [ring, glint]);
    if (this.reduced) { this.time.delayedCall(140, () => bubble.destroy()); return; }
    this.tweens.add({ targets: bubble, x: Phaser.Math.Between(-16, 16), y: -55, alpha: 0, duration: 570, ease: 'Sine.out', onComplete: () => bubble.destroy() });
  }
}

export function mountCrab(): CrabScene {
  const scene = new CrabScene();
  new Phaser.Game({
    type: Phaser.CANVAS, width: 600, height: 260, parent: 'crab-stage',
    transparent: true, scene, banner: false, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, expandParent: false },
    render: { antialias: true, roundPixels: false }, fps: { target: 60, forceSetTimeOut: false },
  });
  return scene;
}
