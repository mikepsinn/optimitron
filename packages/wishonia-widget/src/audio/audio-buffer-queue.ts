/**
 * AudioBufferQueue — Streaming PCM playback with persistent AnalyserNode.
 *
 * Accepts raw PCM audio chunks (e.g. from Gemini Live API) and plays them
 * gaplessly through Web Audio API. Exposes an AnalyserNode that can be
 * wired into WishoniaCharacter for real-time lip-sync.
 */

export class AudioBufferQueue {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private pendingCount = 0;

  /** Fires when all queued audio finishes playing */
  onPlaybackEnd?: () => void;

  constructor(audioContext: AudioContext) {
    this.ctx = audioContext;

    this.gainNode = this.ctx.createGain();
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.3;

    // Persistent graph: GainNode → AnalyserNode → destination
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
  }

  /** AnalyserNode for lip-sync — pass to WishoniaCharacter */
  getAnalyserNode(): AnalyserNode {
    return this.analyserNode;
  }

  /** Enqueue a chunk of PCM audio for gapless playback */
  enqueue(pcmData: Float32Array, sampleRate: number): void {
    if (pcmData.length === 0) return;

    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const buffer = this.ctx.createBuffer(1, pcmData.length, sampleRate);
    buffer.getChannelData(0).set(pcmData);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Schedule for gapless playback
    const startTime = Math.max(this.ctx.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    this.pendingCount++;
    this.activeSources.push(source);

    source.onended = () => {
      this.pendingCount--;
      const idx = this.activeSources.indexOf(source);
      if (idx >= 0) this.activeSources.splice(idx, 1);
      if (this.pendingCount === 0) {
        this.onPlaybackEnd?.();
      }
    };
  }

  /** Stop all playback and empty the queue */
  clear(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // May already be stopped
      }
    }
    this.activeSources = [];
    this.pendingCount = 0;
    this.nextStartTime = 0;
  }

  /** Set volume (0–1) */
  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.ctx.currentTime,
    );
  }

  /** Clean up all Web Audio resources */
  dispose(): void {
    this.clear();
    try {
      this.gainNode.disconnect();
      this.analyserNode.disconnect();
    } catch {
      // May already be disconnected
    }
  }
}
