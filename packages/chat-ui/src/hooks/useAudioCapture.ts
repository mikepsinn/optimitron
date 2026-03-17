import { useState, useRef, useCallback, useEffect } from 'react';
import { createWorkletBlobUrl } from './pcm-worklet-processor.js';

export interface UseAudioCaptureOptions {
  /** Called with raw 16kHz PCM Int16 ArrayBuffer chunks */
  onAudioChunk: (chunk: ArrayBuffer) => void;
}

export interface UseAudioCaptureReturn {
  start: () => Promise<void>;
  stop: () => void;
  isCapturing: boolean;
  analyserNode: AnalyserNode | null;
}

/**
 * Hook for mic capture via getUserMedia + AudioWorkletNode.
 * Downsamples browser audio (48kHz) to 16kHz PCM and calls onAudioChunk.
 */
export function useAudioCapture({ onAudioChunk }: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const onChunkRef = useRef(onAudioChunk);

  // Keep callback ref current without re-creating start/stop
  useEffect(() => {
    onChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  const start = useCallback(async () => {
    if (audioContextRef.current) return; // already capturing

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      }
      throw err;
    }
    streamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = ctx;

    const workletUrl = createWorkletBlobUrl();
    await ctx.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    setAnalyserNode(analyser);

    const worklet = new AudioWorkletNode(ctx, 'pcm-downsample-processor');
    workletNodeRef.current = worklet;

    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      onChunkRef.current(event.data);
    };

    source.connect(analyser);
    analyser.connect(worklet);
    // worklet is a sink — no further connection needed

    setIsCapturing(true);
  }, []);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;

    setAnalyserNode(null);
    setIsCapturing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  return { start, stop, isCapturing, analyserNode };
}
