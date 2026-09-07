export class AudioSystem {
  ctx?: AudioContext;
  muted = false;
  hum?: OscillatorNode;
  gain?: GainNode;
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.hum = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      this.hum.type = "triangle";
      this.hum.frequency.value = 65;
      this.gain.gain.value = 0.014;
      this.hum.connect(this.gain).connect(this.ctx.destination);
      this.hum.start();
    }
    void this.ctx.resume();
  }
  play(kind: "jump" | "collect" | "hurt" | "laser" | "platform" | "complete") {
    if (!this.ctx || this.muted) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = kind === "hurt" ? "sawtooth" : "sine";
    const f = {
      jump: 340,
      collect: 900,
      hurt: 120,
      laser: 160,
      platform: 520,
      complete: 660,
    }[kind];
    o.frequency.setValueAtTime(f, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      kind === "hurt" ? 40 : f * 1.7,
      c.currentTime + 0.14,
    );
    g.gain.setValueAtTime(0.045, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.23);
  }
  toggle() {
    this.muted = !this.muted;
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.014;
    return this.muted;
  }
  destroy() {
    void this.ctx?.close();
  }
}
