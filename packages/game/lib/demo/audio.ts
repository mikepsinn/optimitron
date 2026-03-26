// Web Audio API sound effects for Sierra-style chiptune sounds

type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Resume audio context on user interaction (required by browsers)
export function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    return ctx.resume();
  }
  return Promise.resolve();
}

/**
 * Play a single tone
 */
export function playTone(options: ToneOptions): void {
  const { freq, duration, type = "square", volume = 0.3 } = options;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

/**
 * Play a sequence of tones (melody/jingle)
 */
export function playSequence(
  frequencies: number[],
  noteDuration: number,
  type: OscillatorType = "square",
  volume = 0.3
): void {
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      playTone({ freq, duration: noteDuration, type, volume });
    }, index * noteDuration * 1000);
  });
}

/**
 * Play a frequency sweep
 */
export function sweepTone(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

/**
 * Sierra death jingle (dun-dun-dun-duuuun)
 */
export function playDeathJingle(): void {
  const notes = [
    { freq: 392, duration: 0.2 }, // G4
    { freq: 349, duration: 0.2 }, // F4
    { freq: 330, duration: 0.2 }, // E4
    { freq: 262, duration: 0.6 }, // C4 (long)
  ];

  let delay = 0;
  notes.forEach((note) => {
    setTimeout(() => {
      playTone({ freq: note.freq, duration: note.duration, type: "sawtooth", volume: 0.4 });
    }, delay * 1000);
    delay += note.duration;
  });
}

/**
 * Victory fanfare
 */
export function playVictoryFanfare(): void {
  const notes = [
    { freq: 523, duration: 0.15 }, // C5
    { freq: 659, duration: 0.15 }, // E5
    { freq: 784, duration: 0.15 }, // G5
    { freq: 1047, duration: 0.4 }, // C6
  ];

  let delay = 0;
  notes.forEach((note) => {
    setTimeout(() => {
      playTone({ freq: note.freq, duration: note.duration, type: "square", volume: 0.3 });
    }, delay * 1000);
    delay += note.duration;
  });
}

/**
 * Restore game "bwoing" sound
 */
export function playRestoreSound(): void {
  sweepTone(200, 800, 0.3, "sine", 0.4);
  setTimeout(() => {
    playTone({ freq: 800, duration: 0.1, type: "square", volume: 0.2 });
  }, 300);
}

/**
 * Item pickup "cha-ching"
 */
export function playPickupSound(): void {
  playSequence([523, 659, 784], 0.08, "square", 0.3);
}

// Sound effect presets
export const SFX = {
  typewriter: () => playTone({ freq: 800, duration: 0.02, type: "square", volume: 0.1 }),
  death: playDeathJingle,
  restore: playRestoreSound,
  pickup: playPickupSound,
  questFill: () => sweepTone(200, 800, 0.5, "sine", 0.3),
  gameOver: playDeathJingle,
  victory: playVictoryFanfare,
  click: () => playTone({ freq: 1000, duration: 0.01, type: "square", volume: 0.2 }),
  error: () => playTone({ freq: 200, duration: 0.3, type: "sawtooth", volume: 0.3 }),
  ticker: () => playTone({ freq: 600, duration: 0.05, type: "square", volume: 0.05 }),
  hover: () => playTone({ freq: 400, duration: 0.02, type: "sine", volume: 0.1 }),
  slideChange: () => playTone({ freq: 300, duration: 0.1, type: "triangle", volume: 0.15 }),
  scoreUp: () => sweepTone(400, 800, 0.2, "square", 0.2),
};

// Background music state
let musicOscillators: OscillatorNode[] = [];
let musicGainNode: GainNode | null = null;

/**
 * Simple background drone/pad (placeholder for real music)
 */
export function startBackgroundMusic(mode: "horror" | "hope" | "victory" = "hope"): void {
  stopBackgroundMusic();

  try {
    const ctx = getAudioContext();
    musicGainNode = ctx.createGain();
    musicGainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    musicGainNode.connect(ctx.destination);

    const chords = {
      horror: [130.81, 155.56, 196.0], // C minor-ish
      hope: [261.63, 329.63, 392.0], // C major
      victory: [349.23, 440.0, 523.25], // F major
    };

    const frequencies = chords[mode];

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(musicGainNode!);
      osc.start();
      musicOscillators.push(osc);
    });
  } catch {
    // Audio not available
  }
}

export function stopBackgroundMusic(): void {
  musicOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Already stopped
    }
  });
  musicOscillators = [];

  if (musicGainNode) {
    musicGainNode.disconnect();
    musicGainNode = null;
  }
}

export function setMusicVolume(volume: number): void {
  if (musicGainNode) {
    const ctx = getAudioContext();
    musicGainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
  }
}
