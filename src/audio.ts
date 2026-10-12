export class Sound {
  private ctx?: AudioContext;
  muted = false;
  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  private tone(from: number, to: number, duration: number, volume: number, type: OscillatorType = 'sine') {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
    gain.gain.setValueAtTime(.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration + .02);
  }
  pop() { this.tone(360, 860, .09, .11); }
  wrong() { this.tone(140, 100, .07, .045, 'triangle'); }
  drop() { this.tone(190, 65, .15, .13, 'triangle'); }
  stamp() { this.tone(450, 220, .065, .08, 'triangle'); }
  /** Three evenly spaced cues and a higher GO. Audio clock keeps the rhythm steady. */
  countIn() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return () => {};
    const ctx = this.ctx;
    const oscillators: OscillatorNode[] = [];
    for (let beat = 0; beat < 4; beat++) {
      const at = ctx.currentTime + .06 + beat * .75;
      const go = beat === 3, duration = go ? .2 : .09;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(go ? 880 : 440, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(go ? .12 : .085, at + .006);
      gain.gain.exponentialRampToValueAtTime(.001, at + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(at); osc.stop(at + duration + .03);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      oscillators.push(osc);
    }
    return () => oscillators.forEach(osc => { try { osc.stop(); } catch { /* Already ended. */ } });
  }
  wave() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, buffer = ctx.createBuffer(1, ctx.sampleRate * 1.7, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1000;
    gain.gain.setValueAtTime(.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(.19, ctx.currentTime + .6);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.7);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
  }
  sizzle() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, buffer = ctx.createBuffer(1, ctx.sampleRate * 1.4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .3;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'highpass'; filter.frequency.value = 1800;
    gain.gain.setValueAtTime(.001, ctx.currentTime); gain.gain.linearRampToValueAtTime(.16, ctx.currentTime + .4);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.4);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
  }
  cancelSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  speak(text: string, onFail: () => void) {
    this.cancelSpeech();
    if (this.muted || !('speechSynthesis' in window)) { onFail(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; utterance.rate = .85; utterance.volume = .8;
    const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ja'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => { if (event.error !== 'canceled' && event.error !== 'interrupted') onFail(); };
    speechSynthesis.speak(utterance);
  }
}
