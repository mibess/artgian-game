import { loadSettings, saveSettings } from "./Records";
import { levelTracks, midiToFreq, type TrackConfig } from "./MusicTracks";

export type SoundEffect = "jump" | "land" | "collect" | "hurt" | "laser" | "platform"
  | "milestone" | "go" | "star" | "complete";

export class AudioSystem {
  ctx?: AudioContext;
  muted = loadSettings().muted;
  hum?: OscillatorNode;
  gain?: GainNode;
  private masterGain?: GainNode;

  // Music sequencer and synthesizer state
  private musicGain?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private currentLevelId?: string;
  private currentTrack?: TrackConfig;
  private timerId?: number;
  private nextStepTime = 0;
  private stepIndex = 0;
  private isMusicPlaying = false;
  private musicPaused = false;
  private musicVolume = 0.08365;

  unlock() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      // One shared output raises every sound by 50%, including effect tails.
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.5;
      this.masterGain.connect(this.ctx.destination);

      // Master gain for ambient / hum
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : 0.004;

      // Master gain for music
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
      this.musicGain.connect(this.masterGain);

      // Low hum for ambient grounding
      this.hum = this.ctx.createOscillator();
      this.hum.type = "triangle";
      this.hum.frequency.value = 65;
      this.hum.connect(this.gain).connect(this.masterGain);
      this.hum.start();

      this.initNoiseBuffer();
    }

    void this.ctx.resume().then(() => {
      if (this.currentLevelId && !this.isMusicPlaying && !this.musicPaused) {
        this.startLevelMusic(this.currentLevelId);
      }
    });
  }

  private initNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  startLevelMusic(levelId: string) {
    this.musicPaused = false;
    this.currentLevelId = levelId;
    this.currentTrack = levelTracks[levelId] ?? levelTracks.workshop;

    if (!this.ctx) {
      this.unlock();
      return;
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    if (!this.noiseBuffer) {
      this.initNoiseBuffer();
    }

    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.06;
    this.isMusicPlaying = true;

    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.muted ? 0 : this.musicVolume, this.ctx.currentTime);
    }

    this.timerId = window.setInterval(() => this.scheduleNextSteps(), 25);
  }

  private scheduleNextSteps() {
    if (!this.ctx || !this.currentTrack || !this.isMusicPlaying) return;
    const track = this.currentTrack;
    const stepDuration = 60 / (track.bpm * track.stepsPerBeat);
    const lookAhead = 0.12;

    while (this.nextStepTime < this.ctx.currentTime + lookAhead) {
      this.scheduleStep(this.stepIndex, this.nextStepTime, stepDuration, track);
      this.nextStepTime += stepDuration;
      const totalSteps = Math.max(
        track.lead.length,
        track.bass.length,
        track.harmony.length,
        track.drums.length,
      );
      this.stepIndex = (this.stepIndex + 1) % totalSteps;
    }
  }

  private scheduleStep(
    step: number,
    time: number,
    stepDuration: number,
    track: TrackConfig,
  ) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Lead melody
    const leadMidi = track.lead[step % track.lead.length];
    if (leadMidi && leadMidi > 0) {
      this.playSynthNote(leadMidi, time, stepDuration * 0.9, track.instruments.lead);
    }

    // 2. Bassline
    const bassMidi = track.bass[step % track.bass.length];
    if (bassMidi && bassMidi > 0) {
      this.playSynthNote(bassMidi, time, stepDuration * 0.85, track.instruments.bass);
    }

    // 3. Harmony / Chords / Arpeggio
    const harm = track.harmony[step % track.harmony.length];
    if (Array.isArray(harm)) {
      for (const m of harm) {
        if (m > 0) {
          this.playSynthNote(m, time, stepDuration * 3.8, track.instruments.harmony);
        }
      }
    } else if (harm && harm > 0) {
      this.playSynthNote(harm, time, stepDuration * 0.9, track.instruments.harmony);
    }

    // 4. Drums / Percussion
    const drum = track.drums[step % track.drums.length];
    if (drum && drum !== "-") {
      this.scheduleDrums(drum, time, track.drumVolume);
    }
  }

  private playSynthNote(
    midi: number,
    time: number,
    duration: number,
    inst: TrackConfig["instruments"]["lead"],
  ) {
    if (!this.ctx || !this.musicGain) return;
    const freq = midiToFreq(midi);
    if (freq <= 0) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = inst.type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(inst.filterFreq, time);
    if (inst.q) filter.Q.setValueAtTime(inst.q, time);

    const targetVol = inst.volume;
    const attack = Math.max(0.005, inst.attack);
    const decay = Math.max(0.02, inst.decay);
    const sustainVol = targetVol * inst.sustain;

    // ADSR Envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(targetVol, time + attack);
    gain.gain.linearRampToValueAtTime(sustainVol, time + attack + decay);

    const stopTime = time + duration;
    gain.gain.setValueAtTime(sustainVol, stopTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(stopTime + 0.05);
  }

  private scheduleDrums(drumPattern: string, time: number, masterDrumVol: number) {
    if (!this.ctx || !this.musicGain) return;

    if (drumPattern.includes("k")) {
      this.playKick(time, masterDrumVol * 0.45);
    }
    if (drumPattern.includes("s")) {
      this.playSnare(time, masterDrumVol * 0.3);
    }
    if (drumPattern.includes("c")) {
      this.playClap(time, masterDrumVol * 0.28);
    }
    if (drumPattern.includes("o")) {
      this.playHiHat(time, true, masterDrumVol * 0.16);
    } else if (drumPattern.includes("h")) {
      this.playHiHat(time, false, masterDrumVol * 0.14);
    }
  }

  private playKick(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private playSnare(time: number, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1300, time);
    filter.Q.setValueAtTime(1.2, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(190, time);
    tone.frequency.exponentialRampToValueAtTime(70, time + 0.08);

    toneGain.gain.setValueAtTime(vol * 0.6, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    tone.connect(toneGain);
    toneGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.17);
    tone.start(time);
    tone.stop(time + 0.11);
  }

  private playClap(time: number, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1900, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.setValueAtTime(vol * 0.3, time + 0.015);
    gain.gain.setValueAtTime(vol, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.23);
  }

  private playHiHat(time: number, open: boolean, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(8500, time);

    const gain = this.ctx.createGain();
    const dur = open ? 0.22 : 0.045;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + dur + 0.01);
  }

  pauseMusic() {
    this.musicPaused = true;
    this.isMusicPlaying = false;
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    }
  }

  resumeMusic() {
    this.musicPaused = false;
    if (!this.ctx || !this.currentTrack) return;
    this.isMusicPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(
        this.muted ? 0 : this.musicVolume,
        this.ctx.currentTime + 0.1,
      );
    }
    if (!this.timerId) {
      this.timerId = window.setInterval(() => this.scheduleNextSteps(), 25);
    }
  }

  duckMusic(duration = 2.0) {
    if (this.ctx && this.musicGain && !this.muted) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(
        this.musicVolume * 0.2,
        this.ctx.currentTime + 0.2,
      );
      this.musicGain.gain.setValueAtTime(
        this.musicVolume * 0.2,
        this.ctx.currentTime + duration,
      );
      this.musicGain.gain.linearRampToValueAtTime(
        this.musicVolume,
        this.ctx.currentTime + duration + 0.8,
      );
    }
  }

  stopMusic() {
    this.musicPaused = true;
    this.isMusicPlaying = false;
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  private tone(freq: number, at: number, duration: number, type: OscillatorType = "sine",
    volume = 0.06, endFreq = freq) {
    if (!this.ctx || !this.masterGain) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq !== freq) o.frequency.exponentialRampToValueAtTime(endFreq, at + duration * 0.7);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + duration);
    o.connect(g).connect(this.masterGain);
    o.start(at);
    o.stop(at + duration + 0.02);
  }

  /** `step` raises pitch for streaks (collect) or picks the note (star). */
  play(kind: SoundEffect, step = 0) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const t = this.ctx.currentTime;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const note = (semitones: number, base = 523.25) => base * 2 ** (semitones / 12);
    switch (kind) {
      case "jump": this.tone(300 + Math.random() * 30, t, 0.16, "sine", 0.05, 560); break;
      case "land": this.tone(140, t, 0.08, "triangle", 0.035, 70); break;
      case "collect": {
        const f = note(scale[Math.min(step, scale.length - 1)], 880);
        this.tone(f, t, 0.12, "triangle", 0.05);
        this.tone(f * 1.5, t + 0.05, 0.18, "sine", 0.04);
        break;
      }
      case "hurt":
        this.tone(220, t, 0.25, "sawtooth", 0.06, 50);
        this.tone(110, t, 0.3, "square", 0.025, 40);
        break;
      case "laser": this.tone(160, t, 0.22, "sine", 0.06, 270); break;
      case "platform":
        [0, 4, 7].forEach((n, i) => this.tone(note(n), t + i * 0.07, 0.25, "triangle", 0.05));
        break;
      case "milestone":
        [0, 7, 12].forEach((n, i) => this.tone(note(n, 659.25), t + i * 0.06, 0.2, "sine", 0.045));
        break;
      case "go":
        this.tone(note(0), t, 0.12, "triangle", 0.05);
        this.tone(note(7), t + 0.1, 0.28, "triangle", 0.06);
        break;
      case "star":
        [0, 4, 7, 12].forEach((n, i) =>
          this.tone(note(n + step * 2, 659.25), t + i * 0.045, 0.32, i % 2 ? "sine" : "triangle", 0.045));
        break;
      case "complete":
        [0, 4, 7, 12, 16].forEach((n, i) => this.tone(note(n), t + i * 0.09, 0.5, "triangle", 0.05));
        this.tone(note(-12), t, 0.9, "sine", 0.04);
        break;
    }
  }

  toggle() {
    this.muted = !this.muted;
    saveSettings({ muted: this.muted });
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.004;
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
    }
    return this.muted;
  }

  destroy() {
    this.stopMusic();
    void this.ctx?.close();
  }
}
