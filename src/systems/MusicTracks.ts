// Musical notes and compositions for the levels of Artgian Jump

export const midiToFreq = (midi: number): number =>
  midi <= 0 ? 0 : 440 * Math.pow(2, (midi - 69) / 12);

// Standard note constants
const _ = 0; // Rest for tonal tracks
const r = "-"; // Rest for drum tracks

// Octave 1 & 2 (Bass)
const C1 = 24, Cs1 = 25, D1 = 26, Eb1 = 27, Ds1 = 27, E1 = 28, F1 = 29, Fs1 = 30, G1 = 31, Ab1 = 32, A1 = 33, Bb1 = 34, B1 = 35;
const C2 = 36, Cs2 = 37, D2 = 38, Eb2 = 39, Ds2 = 39, E2 = 40, F2 = 41, Fs2 = 42, G2 = 43, Ab2 = 44, A2 = 45, Bb2 = 46, B2 = 47;

// Octave 3 (Low / Mid / Arp)
const C3 = 48, Cs3 = 49, D3 = 50, Eb3 = 51, Ds3 = 51, E3 = 52, F3 = 53, Fs3 = 54, G3 = 55, Ab3 = 56, A3 = 57, Bb3 = 58, B3 = 59;

// Octave 4 (Mid / Harmony / Melody)
const C4 = 60, Cs4 = 61, D4 = 62, Eb4 = 63, Ds4 = 63, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67, Ab4 = 68, A4 = 69, Bb4 = 70, B4 = 71;

// Octave 5 (Lead Melody)
const C5 = 72, Cs5 = 73, D5 = 74, Eb5 = 75, Ds5 = 75, E5 = 76, F5 = 77, Fs5 = 78, G5 = 79, Ab5 = 80, A5 = 81, Bb5 = 82, B5 = 83;

// Octave 6 (High accents)
const C6 = 84, D6 = 86, E6 = 88;

export interface TrackConfig {
  bpm: number;
  stepsPerBeat: number;
  drumVolume: number;
  instruments: {
    lead: {
      type: OscillatorType;
      filterFreq: number;
      q?: number;
      attack: number;
      decay: number;
      sustain: number;
      volume: number;
    };
    bass: {
      type: OscillatorType;
      filterFreq: number;
      q?: number;
      attack: number;
      decay: number;
      sustain: number;
      volume: number;
    };
    harmony: {
      type: OscillatorType;
      filterFreq: number;
      q?: number;
      attack: number;
      decay: number;
      sustain: number;
      volume: number;
    };
  };
  lead: number[];
  bass: number[];
  harmony: (number[] | number)[];
  drums: string[];
}

/**
 * Level 1: Workshop (Oficina)
 * Style: Chiptune / Electro-Industrial Arcade Groove
 * Key: D minor
 * BPM: 128 (driving mechanical tempo)
 */
const workshopTrack: TrackConfig = {
  bpm: 128,
  stepsPerBeat: 4,
  drumVolume: 0.85,
  instruments: {
    lead: {
      type: "square",
      filterFreq: 3200,
      q: 2,
      attack: 0.008,
      decay: 0.12,
      sustain: 0.45,
      volume: 0.18,
    },
    bass: {
      type: "sawtooth",
      filterFreq: 850,
      q: 4,
      attack: 0.01,
      decay: 0.14,
      sustain: 0.2,
      volume: 0.24,
    },
    harmony: {
      type: "triangle",
      filterFreq: 2200,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.35,
      volume: 0.14,
    },
  },
  // 4 measures (64 steps of 16th notes)
  bass: [
    // Measure 1: Dm
    D2, _, D2, _, F2, _, G2, _, D2, _, D2, _, C2, _, Cs2, _,
    // Measure 2: Bb - C
    Bb1, _, Bb1, _, D2, _, F2, _, C2, _, C2, _, E2, _, G2, _,
    // Measure 3: Dm
    D2, _, D2, _, F2, _, A2, _, G2, _, F2, _, E2, _, C2, _,
    // Measure 4: Bb - A
    Bb1, _, Bb1, _, D2, _, F2, _, A1, _, A1, _, Cs2, _, E2, _,
  ],
  harmony: [
    // Fast rolling 16th arpeggio (stacking layers like a 3D printer)
    // Measure 1
    D3, F3, A3, D4, F3, A3, D4, F4, D3, F3, A3, D4, F3, A3, D4, F4,
    // Measure 2
    Bb2, D3, F3, Bb3, D3, F3, Bb3, D4, C3, E3, G3, C4, E3, G3, C4, E4,
    // Measure 3
    D3, F3, A3, D4, F3, A3, D4, F4, D3, F3, A3, D4, C3, E3, G3, C4,
    // Measure 4
    Bb2, D3, F3, Bb3, D3, F3, Bb3, D4, A2, Cs3, E3, A3, Cs3, E3, A3, Cs4,
  ],
  lead: [
    // Measure 1: Heroic arcade theme phrase 1
    D5, _, _, F5, G5, _, A5, _, _, C6, A5, _, G5, _, F5, _,
    // Measure 2: Phrase 1 resolution
    G5, _, A5, _, F5, _, D5, _, _, C5, D5, _, E5, _, F5, _,
    // Measure 3: Phrase 2 climbing
    D5, _, _, F5, G5, _, A5, _, C6, _, D6, _, C6, _, A5, _,
    // Measure 4: Phrase 2 punchy descent
    G5, _, A5, G5, F5, _, E5, _, D5, _, _, _, _, _, _, _,
  ],
  drums: [
    // Measure 1
    "kh", "h", "h", "h", "sh", "h", "kh", "h", "kh", "h", "h", "h", "sh", "h", "h", "o",
    // Measure 2
    "kh", "h", "h", "h", "sh", "h", "h", "h", "kh", "h", "kh", "h", "sh", "h", "h", "o",
    // Measure 3
    "kh", "h", "h", "h", "sh", "h", "kh", "h", "kh", "h", "h", "h", "sh", "h", "h", "o",
    // Measure 4
    "kh", "h", "kh", "h", "sh", "h", "h", "h", "kh", "kh", "h", "h", "sh", "sh", "o", "o",
  ],
};

/**
 * Level 2: Home (Casa)
 * Style: Cozy Lo-Fi / Chill Melodic Acoustic Synth
 * Key: C major / A minor
 * BPM: 92 (relaxed, warm, tranquil)
 */
const homeTrack: TrackConfig = {
  bpm: 92,
  stepsPerBeat: 4,
  drumVolume: 0.65,
  instruments: {
    lead: {
      type: "sine",
      filterFreq: 1800,
      attack: 0.02,
      decay: 0.28,
      sustain: 0.3,
      volume: 0.26,
    },
    bass: {
      type: "triangle",
      filterFreq: 500,
      attack: 0.03,
      decay: 0.25,
      sustain: 0.4,
      volume: 0.32,
    },
    harmony: {
      type: "triangle",
      filterFreq: 1200,
      attack: 0.08,
      decay: 0.35,
      sustain: 0.5,
      volume: 0.18,
    },
  },
  bass: [
    // Measure 1: Cmaj7
    C2, _, _, _, C2, _, _, G1, C2, _, _, _, G1, _, B1, _,
    // Measure 2: Am7
    A1, _, _, _, A1, _, _, E1, A1, _, _, _, E1, _, G1, _,
    // Measure 3: Fmaj7
    F1, _, _, _, F1, _, _, C2, F1, _, _, _, C1, _, E1, _,
    // Measure 4: G7sus - G7
    G1, _, _, _, G1, _, _, D1, G1, _, _, _, B1, _, D2, _,
  ],
  harmony: [
    // Lush 7th chords sustained across beats
    // Measure 1: Cmaj7 (C4, E4, G4, B4)
    [C4, E4, G4, B4], _, _, _, [C4, E4, G4, B4], _, _, _, [E4, G4, B4, D5], _, _, _, [C4, E4, G4, B4], _, _, _,
    // Measure 2: Am7 (A3, C4, E4, G4)
    [A3, C4, E4, G4], _, _, _, [A3, C4, E4, G4], _, _, _, [C4, E4, G4, B4], _, _, _, [A3, C4, E4, G4], _, _, _,
    // Measure 3: Fmaj7 (F3, A3, C4, E4)
    [F3, A3, C4, E4], _, _, _, [F3, A3, C4, E4], _, _, _, [A3, C4, E4, G4], _, _, _, [F3, A3, C4, E4], _, _, _,
    // Measure 4: G7sus4 -> G7
    [G3, C4, D4, F4], _, _, _, [G3, C4, D4, F4], _, _, _, [G3, B3, D4, F4], _, _, _, [G3, B3, D4, F4], _, _, _,
  ],
  lead: [
    // Warm, soothing kalimba-like melody
    // Measure 1
    E5, _, _, G5, _, _, B5, _, A5, _, G5, _, E5, _, D5, _,
    // Measure 2
    C5, _, _, D5, E5, _, _, _, G4, _, _, _, _, _, _, _,
    // Measure 3
    A4, _, C5, _, E5, _, G5, _, F5, _, E5, _, D5, _, C5, _,
    // Measure 4
    D5, _, _, E5, D5, _, _, _, C5, _, _, _, _, _, _, _,
  ],
  drums: [
    // Gentle lo-fi pattern with warm kick, soft rimshot & subtle shaker
    // Measure 1
    "kh", r, "h", r, "sh", r, "h", r, "kh", r, "h", r, "sh", r, "h", "o",
    // Measure 2
    "kh", r, "h", r, "sh", r, "h", r, "kh", r, "kh", r, "sh", r, "h", r,
    // Measure 3
    "kh", r, "h", r, "sh", r, "h", r, "kh", r, "h", r, "sh", r, "h", "o",
    // Measure 4
    "kh", r, "h", r, "sh", r, "h", "h", "kh", r, "h", r, "sh", r, "o", r,
  ],
};

/**
 * Level 3: Studio (Estúdio)
 * Style: French Electro-Funk / Synthwave Rhythm
 * Key: E minor / G major
 * BPM: 133.333 (exactly 450ms per beat; 8 beats = 3600ms, matching the in-game rhythm platform cycle!)
 */
const studioTrack: TrackConfig = {
  bpm: 133.333,
  stepsPerBeat: 4,
  drumVolume: 0.95,
  instruments: {
    lead: {
      type: "sawtooth",
      filterFreq: 2600,
      q: 3,
      attack: 0.01,
      decay: 0.16,
      sustain: 0.5,
      volume: 0.22,
    },
    bass: {
      type: "sawtooth",
      filterFreq: 1100,
      q: 5,
      attack: 0.008,
      decay: 0.12,
      sustain: 0.35,
      volume: 0.28,
    },
    harmony: {
      type: "square",
      filterFreq: 1600,
      attack: 0.015,
      decay: 0.18,
      sustain: 0.4,
      volume: 0.16,
    },
  },
  bass: [
    // Funky octave synth-bass
    // Measure 1: Em
    E2, E3, _, E2, _, E3, G2, _, A2, A3, _, A2, _, G2, Fs2, _,
    // Measure 2: C - D
    C2, C3, _, C2, _, C3, E2, _, D2, D3, _, D2, _, B1, D2, _,
    // Measure 3: Em
    E2, E3, _, E2, _, E3, G2, _, A2, A3, _, A2, _, B2, D3, _,
    // Measure 4: C - B7
    C2, C3, _, C2, _, E2, G2, _, B1, B2, _, B1, _, Ds2, Fs2, _,
  ],
  harmony: [
    // Funky disco stabs on upbeat 16ths
    // Measure 1: Em9
    _, [G4, B4, D5], _, _, [G4, B4, D5], _, _, [G4, B4, D5], _, [A4, C5, E5], _, _, [G4, B4, D5], _, _, _,
    // Measure 2: Cmaj7 - D
    _, [G4, B4, E5], _, _, [G4, B4, E5], _, _, [Fs4, A4, D5], _, [Fs4, A4, D5], _, _, [Fs4, A4, D5], _, _, _,
    // Measure 3: Em9
    _, [G4, B4, D5], _, _, [G4, B4, D5], _, _, [G4, B4, D5], _, [A4, C5, E5], _, _, [B4, D5, Fs5], _, _, _,
    // Measure 4: Cmaj7 - B7
    _, [G4, B4, E5], _, _, [G4, B4, E5], _, _, [Fs4, A4, Ds5], _, [Fs4, A4, Ds5], _, _, [Fs4, A4, Ds5], _, _, _,
  ],
  lead: [
    // Catchy synthwave lead hook
    // Measure 1
    B5, _, _, G5, E5, _, G5, _, A5, _, B5, _, D6, _, B5, _,
    // Measure 2
    G5, _, E5, _, G5, _, A5, _, Fs5, _, _, _, _, _, _, _,
    // Measure 3
    B5, _, _, D6, E6, _, D6, _, B5, _, A5, _, G5, _, A5, _,
    // Measure 4
    B5, _, A5, G5, E5, _, _, _, E5, _, _, _, _, _, _, _,
  ],
  drums: [
    // Four-on-the-floor with punchy open hats on offbeats and snappy claps
    // Measure 1
    "kh", "h", "o", "h", "kch", "h", "o", "h", "kh", "h", "o", "h", "kch", "h", "o", "h",
    // Measure 2
    "kh", "h", "o", "h", "kch", "h", "o", "h", "kh", "h", "o", "h", "kch", "h", "h", "o",
    // Measure 3
    "kh", "h", "o", "h", "kch", "h", "o", "h", "kh", "h", "o", "h", "kch", "h", "o", "h",
    // Measure 4
    "kh", "h", "o", "h", "kch", "h", "o", "h", "kh", "kh", "o", "h", "kch", "ch", "o", "o",
  ],
};

export const levelTracks: Record<string, TrackConfig> = {
  workshop: workshopTrack,
  home: homeTrack,
  studio: studioTrack,
  garden: { ...homeTrack, bpm: 88 },
};
