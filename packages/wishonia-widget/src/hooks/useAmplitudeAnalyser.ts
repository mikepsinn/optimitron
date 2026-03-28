import { useEffect, useRef, useState } from "react";

/**
 * Creates a Web Audio AnalyserNode from an HTMLAudioElement.
 * Returns the AnalyserNode for use with useWishoniaAnimator.
 */
export function useAmplitudeAnalyser(
  audioElement: HTMLAudioElement | null,
): AnalyserNode | null {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !audioElement) {
      setAnalyser(null);
      return;
    }

    // Reuse existing context or create new one
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;

    // Only create one source per audio element
    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audioElement);
      } catch {
        // Element may already have a source — happens on HMR
        setAnalyser(null);
        return;
      }
    }

    const node = ctx.createAnalyser();
    node.fftSize = 256;
    node.smoothingTimeConstant = 0.3;

    sourceRef.current.connect(node);
    node.connect(ctx.destination);

    setAnalyser(node);

    return () => {
      try {
        sourceRef.current?.disconnect(node);
        node.disconnect();
      } catch {
        // May already be disconnected
      }
      setAnalyser(null);
    };
  }, [audioElement]);

  return analyser;
}
