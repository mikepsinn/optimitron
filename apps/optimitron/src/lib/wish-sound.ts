/**
 * Retro game sounds synthesized via Web Audio API.
 *
 * No audio files needed. Zero latency. Pure 8-bit joy.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  volume: number,
  start: number,
  duration: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

/**
 * Triumphant ascending fanfare — like getting a star or completing a level.
 * C5 → E5 → G5 → C6 with harmonics. ~500ms total. Feels like winning.
 */
export function playWishFanfare(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = 0.1;
    const noteLen = 0.1;
    const gap = 0.1;

    // Ascending major arpeggio: C5 → E5 → G5 → C6
    const notes = [523, 659, 784, 1047];

    notes.forEach((freq, i) => {
      const t = now + i * gap;
      // Main square wave — the 8-bit character
      tone(ctx, freq, "square", vol, t, noteLen + 0.05);
      // Triangle for warmth
      tone(ctx, freq, "triangle", vol * 0.6, t, noteLen + 0.08);
    });

    // Final note rings longer with shimmer
    const finalT = now + notes.length * gap;
    tone(ctx, 1047, "square", vol * 1.2, finalT - gap, 0.3);
    tone(ctx, 1047, "triangle", vol * 0.8, finalT - gap, 0.4);
    // Octave harmonic sparkle
    tone(ctx, 2093, "sine", vol * 0.3, finalT - gap + 0.05, 0.25);

  } catch {
    // Audio not available
  }
}

/**
 * Quick coin pickup sound for small rewards (1-2 wishes).
 * B5 → E6 classic coin. ~150ms.
 */
export function playCoinSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    tone(ctx, 988, "square", 0.12, now, 0.06);
    tone(ctx, 988, "triangle", 0.08, now, 0.06);
    tone(ctx, 1319, "square", 0.12, now + 0.06, 0.15);
    tone(ctx, 1319, "triangle", 0.08, now + 0.06, 0.2);
    tone(ctx, 2637, "sine", 0.03, now + 0.06, 0.12);
  } catch {
    // Audio not available
  }
}

/**
 * Play the appropriate sound based on wish amount.
 * 1-2 wishes: coin sound. 3+: triumphant fanfare.
 */
export function playWishSound(amount: number): void {
  if (amount >= 3) {
    playWishFanfare();
  } else {
    playCoinSound();
  }
}
