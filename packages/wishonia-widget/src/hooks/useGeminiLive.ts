/**
 * useGeminiLive — React hook for Gemini Live API audio streaming.
 *
 * Manages a WebSocket session to Gemini Live, sends text, receives
 * streaming PCM audio, and plays it through an AudioBufferQueue.
 * Returns an AnalyserNode for lip-sync with WishoniaCharacter.
 *
 * Requires @google/genai as a peer dependency.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioBufferQueue } from "../audio/audio-buffer-queue";
import { WISHONIA_VOICE, WISHONIA_SPEAKING_INSTRUCTIONS, WISHONIA_LIVE_MODEL } from "../core/voice-config";

export interface UseGeminiLiveOptions {
  /** URL to fetch ephemeral token (GET → { token: string }) */
  tokenEndpoint: string;
  /** Voice name (default "Kore") */
  voice?: string;
  /** System instruction for speaking style */
  speakingInstructions?: string;
  /** Model ID (default "gemini-3.1-flash-live-preview") */
  model?: string;
  /** Auto-connect on mount (default true) */
  autoConnect?: boolean;
  /** Initial volume 0–1 (default 0.8) */
  volume?: number;
}

export interface UseGeminiLiveReturn {
  /** AnalyserNode for lip-sync — pass to WishoniaCharacter */
  analyserNode: AnalyserNode | null;
  /** Whether the WebSocket session is active */
  isConnected: boolean;
  /** Whether audio is currently being generated/streamed */
  isGenerating: boolean;
  /** Send text to be spoken */
  speak: (text: string) => void;
  /** Stop current audio generation */
  stop: () => void;
  /** Manually connect (if autoConnect=false) */
  connect: () => Promise<void>;
  /** Disconnect the session */
  disconnect: () => void;
  /** Update volume (0–1) */
  setVolume: (v: number) => void;
}

const AUDIO_SAMPLE_RATE = 24000; // Gemini Live outputs 24kHz PCM

/** Decode base64 string to Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Convert 16-bit PCM (little-endian) to Float32Array */
function pcm16ToFloat32(pcm: Uint8Array): Float32Array {
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const samples = new Float32Array(pcm.byteLength / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 32768;
  }
  return samples;
}

export function useGeminiLive(
  options: UseGeminiLiveOptions,
): UseGeminiLiveReturn {
  const {
    tokenEndpoint,
    voice = WISHONIA_VOICE,
    speakingInstructions = WISHONIA_SPEAKING_INSTRUCTIONS,
    model = WISHONIA_LIVE_MODEL,
    autoConnect = true,
    volume = 0.8,
  } = options;

  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs to persist across renders without triggering effects
  const sessionRef = useRef<unknown>(null);
  const queueRef = useRef<AudioBufferQueue | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const connectingRef = useRef(false);
  const mountedRef = useRef(true);

  // Stable refs for options that shouldn't trigger reconnection
  const voiceRef = useRef(voice);
  const modelRef = useRef(model);
  const instructionsRef = useRef(speakingInstructions);
  voiceRef.current = voice;
  modelRef.current = model;
  instructionsRef.current = speakingInstructions;

  const ensureAudioContext = useCallback(() => {
    audioCtxRef.current ??= new AudioContext();
    return audioCtxRef.current;
  }, []);

  const ensureQueue = useCallback(() => {
    if (!queueRef.current) {
      const ctx = ensureAudioContext();
      queueRef.current = new AudioBufferQueue(ctx);
      setAnalyserNode(queueRef.current.getAnalyserNode());
    }
    return queueRef.current;
  }, [ensureAudioContext]);

  const connectSession = useCallback(async () => {
    if (connectingRef.current || sessionRef.current) return;
    connectingRef.current = true;

    try {
      // 1. Fetch ephemeral token
      const res = await fetch(tokenEndpoint);
      if (!res.ok) {
        console.warn("[useGeminiLive] Token endpoint returned", res.status);
        return;
      }
      const tokenData: { token?: string } = await res.json() as { token?: string };
      if (!tokenData.token || !mountedRef.current) return;

      // 2. Dynamic import — only loads @google/genai when actually needed
      const { GoogleGenAI, Modality } = await import("@google/genai");

      const ai = new GoogleGenAI({ apiKey: tokenData.token });
      const queue = ensureQueue();

      // Build config
      const config = {
        responseModalities: [Modality.AUDIO],
        ...(voiceRef.current && {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceRef.current },
            },
          },
        }),
        ...(instructionsRef.current && {
          systemInstruction: {
            parts: [{ text: instructionsRef.current }],
          },
        }),
      };

      // 3. Connect to Live API
      const session = await ai.live.connect({
        model: modelRef.current,
        config,
        callbacks: {
          onopen: () => {
            if (mountedRef.current) setIsConnected(true);
          },
          onmessage: (message) => {
            const serverContent = message.serverContent;

            if (serverContent?.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const pcmBytes = base64ToUint8Array(part.inlineData.data);
                  const floats = pcm16ToFloat32(pcmBytes);
                  queue.enqueue(floats, AUDIO_SAMPLE_RATE);
                }
              }
            }

            if (serverContent?.turnComplete) {
              // Audio may still be playing — onPlaybackEnd fires when it drains
              if (mountedRef.current) setIsGenerating(false);
            }
          },
          onerror: (e) => {
            console.warn("[useGeminiLive] Error:", e.message);
            if (mountedRef.current) {
              setIsConnected(false);
              setIsGenerating(false);
            }
          },
          onclose: () => {
            sessionRef.current = null;
            if (mountedRef.current) {
              setIsConnected(false);
              setIsGenerating(false);
            }
          },
        },
      });

      sessionRef.current = session;
      queue.setVolume(volume);
    } catch (err) {
      console.warn("[useGeminiLive] Connection failed:", err);
      if (mountedRef.current) setIsConnected(false);
    } finally {
      connectingRef.current = false;
    }
  }, [tokenEndpoint, volume, ensureQueue]);

  const speak = useCallback(
    (text: string) => {
      const session = sessionRef.current as {
        sendRealtimeInput?: (input: { text: string }) => void;
      } | null;
      if (!session?.sendRealtimeInput) return;

      // Clear any previous audio
      queueRef.current?.clear();
      setIsGenerating(true);

      session.sendRealtimeInput({ text });
    },
    [],
  );

  const stop = useCallback(() => {
    queueRef.current?.clear();
    setIsGenerating(false);
  }, []);

  const disconnect = useCallback(() => {
    const session = sessionRef.current as { close?: () => void } | null;
    session?.close?.();
    sessionRef.current = null;
    queueRef.current?.clear();
    setIsConnected(false);
    setIsGenerating(false);
  }, []);

  const setVolumeCallback = useCallback((v: number) => {
    queueRef.current?.setVolume(v);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect) {
      void connectSession();
    }
    return () => {
      mountedRef.current = false;
      const session = sessionRef.current as { close?: () => void } | null;
      session?.close?.();
      sessionRef.current = null;
      queueRef.current?.dispose();
      queueRef.current = null;
    };
  }, [autoConnect, connectSession]);

  return {
    analyserNode,
    isConnected,
    isGenerating,
    speak,
    stop,
    connect: connectSession,
    disconnect,
    setVolume: setVolumeCallback,
  };
}
