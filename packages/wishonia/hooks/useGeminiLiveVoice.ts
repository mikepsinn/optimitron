/**
 * useGeminiLiveVoice — Bidirectional Gemini Live voice session for voice mode.
 *
 * Ported from transmit's GeminiLiveClient + AudioCapture + AudioPlayback.
 * Manages WebSocket to Gemini, mic capture, audio playback, lip-sync analyser.
 *
 * This is SEPARATE from WishoniaNarrator's useGeminiLive hook — that one is
 * for one-way narration. This one is for interactive voice conversations.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  shouldForwardMicAudio,
  type VoiceSessionState,
} from "@/lib/voice-mode-utils";

export type VoiceState = VoiceSessionState;

export interface CompletedVoiceTurn {
  id: number;
  transcript: string;
  thinkingText: string;
}

export interface UseGeminiLiveVoiceReturn {
  state: VoiceState;
  /** Connect to Gemini Live and start mic capture */
  connect: () => Promise<void>;
  /** Disconnect everything */
  disconnect: () => void;
  /** Send text (with RAG context) to Gemini for voice response */
  sendText: (text: string) => void;
  /** Transcript of what Gemini is saying (accumulates per turn) */
  outputTranscript: string;
  /** Text-only reasoning that Gemini emitted during the turn */
  thinkingText: string;
  /** Finalized turn payload after Gemini finishes speaking */
  completedTurn: CompletedVoiceTurn | null;
  /** Playback analyser for lip-sync */
  playbackAnalyser: AnalyserNode | null;
  /** Mic volume 0-1 for volume visualizer */
  micVolume: number;
  /** Whether the session is connected */
  isConnected: boolean;
}

const WORKLET_URL = "/audio-worklet-processor.js";
const PLAYBACK_RATE = 24000;

/** Downsample from source rate to 16kHz */
function downsample(input: Int16Array, inputRate: number, outputRate: number): Int16Array {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIndex - low;
    output[i] = Math.round(input[low]! * (1 - frac) + input[high]! * frac);
  }
  return output;
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

interface GeminiLiveCallbacks {
  onReady: () => void;
  onAudio: (b64: string) => void;
  onText: (text: string) => void;
  onOutputTranscript: (text: string) => void;
  onInputTranscript: (text: string) => void;
  onModelTurnStarted: () => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onError: (err: unknown) => void;
}

export function useGeminiLiveVoice(tokenEndpoint: string): UseGeminiLiveVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [completedTurn, setCompletedTurn] = useState<CompletedVoiceTurn | null>(null);
  const [playbackAnalyser, setPlaybackAnalyser] = useState<AnalyserNode | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const setupDoneRef = useRef(false);
  const modelTurnStartedRef = useRef(false);

  // Audio refs
  const captureCtxRef = useRef<AudioContext | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureWorkletRef = useRef<AudioWorkletNode | null>(null);
  const captureAnalyserRef = useRef<AnalyserNode | null>(null);
  const captureRafRef = useRef<number | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackWorkletRef = useRef<AudioWorkletNode | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);

  const pendingTurnCompleteRef = useRef(false);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenRef = useRef("");
  const thinkingRef = useRef("");
  const turnIdRef = useRef(0);
  const mountedRef = useRef(true);
  const stateRef = useRef<VoiceState>("idle");
  const hasLocalSpeechRecognitionRef = useRef(false);
  const micRoutingRef = useRef<boolean | null>(null);

  const setVoiceState = useCallback((next: VoiceState) => {
    stateRef.current = next;
    if (mountedRef.current) setState(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    hasLocalSpeechRecognitionRef.current =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    console.info(
      "[voice-rag] local speech recognition",
      hasLocalSpeechRecognitionRef.current ? "available" : "unavailable"
    );
    return () => { mountedRef.current = false; };
  }, []);

  // --- Audio Playback ---
  const initPlayback = useCallback(async () => {
    const ctx = new AudioContext({ sampleRate: PLAYBACK_RATE });
    await ctx.audioWorklet.addModule(WORKLET_URL);
    const worklet = new AudioWorkletNode(ctx, "playback-processor");

    worklet.port.onmessage = (e) => {
      if (e.data.cmd === "drained") {
        if (pendingTurnCompleteRef.current) {
          pendingTurnCompleteRef.current = false;
          if (drainTimerRef.current) { clearTimeout(drainTimerRef.current); drainTimerRef.current = null; }
          // Finalize turn — back to listening
          const finalizedTranscript = spokenRef.current.trim();
          const finalizedThinking = thinkingRef.current.trim();
          spokenRef.current = "";

          if (mountedRef.current) {
            setCompletedTurn({
              id: ++turnIdRef.current,
              transcript: finalizedTranscript,
              thinkingText: finalizedThinking,
            });
            setState("listening");
          }
        }
      }
    };

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    worklet.connect(analyser);
    analyser.connect(ctx.destination);

    playbackCtxRef.current = ctx;
    playbackWorkletRef.current = worklet;
    playbackAnalyserRef.current = analyser;
    if (mountedRef.current) setPlaybackAnalyser(analyser);
  }, []);

  const playAudioChunk = useCallback((b64: string) => {
    const worklet = playbackWorkletRef.current;
    const ctx = playbackCtxRef.current;
    if (!worklet || !ctx) return;

    if (ctx.state === "suspended") ctx.resume();

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let j = 0; j < int16.length; j++) float32[j] = int16[j]! / 32768;

    worklet.port.postMessage({ samples: float32.buffer }, [float32.buffer]);
  }, []);

  const interruptPlayback = useCallback(() => {
    playbackWorkletRef.current?.port.postMessage({ cmd: "clear" });
  }, []);

  // --- Audio Capture ---
  const initCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: { ideal: 16000 }, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });

    const sampleRate = stream.getAudioTracks()[0]?.getSettings().sampleRate ?? 48000;
    const ctx = new AudioContext({ sampleRate });
    await ctx.audioWorklet.addModule(WORKLET_URL);

    const source = ctx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(ctx, "mic-processor");

    worklet.port.onmessage = (e) => {
      if (!e.data.pcm16) return;
      const shouldSendAudio = shouldForwardMicAudio(
        hasLocalSpeechRecognitionRef.current,
        stateRef.current
      );
      if (micRoutingRef.current !== shouldSendAudio) {
        micRoutingRef.current = shouldSendAudio;
        console.info(
          "[voice-rag] mic audio routing",
          shouldSendAudio ? "forwarding to Gemini Live" : "holding for local RAG",
          { localSpeechRecognition: hasLocalSpeechRecognitionRef.current, state: stateRef.current }
        );
      }
      if (!shouldSendAudio) return;
      const pcm16 = new Int16Array(e.data.pcm16);
      const resampled = downsample(pcm16, sampleRate, 16000);
      const b64 = int16ToBase64(resampled);
      sendAudio(b64);
    };

    source.connect(worklet);
    worklet.connect(ctx.destination);

    // Volume metering
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    function pollVolume() {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let k = 0; k < data.length; k++) sum += data[k]!;
      const avg = sum / data.length / 255;
      if (mountedRef.current) setMicVolume(avg);
      captureRafRef.current = requestAnimationFrame(pollVolume);
    }
    pollVolume();

    captureCtxRef.current = ctx;
    captureStreamRef.current = stream;
    captureSourceRef.current = source;
    captureWorkletRef.current = worklet;
    captureAnalyserRef.current = analyser;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- WebSocket ---
  const sendAudio = useCallback((b64: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !setupDoneRef.current) return;
    ws.send(JSON.stringify({
      realtimeInput: { mediaChunks: [{ data: b64, mimeType: "audio/pcm;rate=16000" }] },
    }));
  }, []);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !setupDoneRef.current) return;
    ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      },
    }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = useCallback((msg: any, cbs: GeminiLiveCallbacks) => {
    if (msg["setupComplete"]) { cbs.onReady(); return; }

    const sc = msg["serverContent"];
    if (!sc) {
      const it = msg["inputTranscription"];
      if (it?.text) cbs.onInputTranscript(it.text);
      return;
    }

    if (sc.inputTranscription?.text) cbs.onInputTranscript(sc.inputTranscription.text);
    if (sc.outputTranscription?.text) cbs.onOutputTranscript(sc.outputTranscription.text);

    if (sc.interrupted) {
      modelTurnStartedRef.current = false;
      cbs.onInterrupted();
      return;
    }

    if (sc.modelTurn?.parts) {
      if (!modelTurnStartedRef.current) {
        modelTurnStartedRef.current = true;
        cbs.onModelTurnStarted();
      }
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.data) cbs.onAudio(part.inlineData.data);
        if (part.text) cbs.onText(part.text);
      }
    }

    if (sc.turnComplete) {
      modelTurnStartedRef.current = false;
      cbs.onTurnComplete();
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    if (!mountedRef.current) return;

    console.info("[voice-rag] connecting Gemini Live");
    setVoiceState("connecting");

    try {
      // 1. Get token
      const res = await fetch(tokenEndpoint);
      if (!res.ok) throw new Error(`Token HTTP ${res.status}`);
      const { token, systemPrompt } = await res.json() as { token: string; systemPrompt: string };

      // 2. Init audio
      await initPlayback();
      await initCapture();

      // 3. Connect WebSocket
      const isEphemeral = token.startsWith("auth_tokens/");
      const base = isEphemeral
        ? "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained"
        : "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
      const param = isEphemeral ? "access_token" : "key";
      const url = `${base}?${param}=${encodeURIComponent(token)}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      const callbacks: GeminiLiveCallbacks = {
        onReady: () => {
          setupDoneRef.current = true;
          console.info("[voice-rag] Gemini Live ready");
          if (mountedRef.current) setIsConnected(true);
          setVoiceState("listening");
        },
        onAudio: (b64) => {
          if (stateRef.current !== "speaking") {
            console.info("[voice-rag] Gemini audio started");
            setVoiceState("speaking");
          }
          playAudioChunk(b64);
        },
        onText: (text) => {
          thinkingRef.current += text;
          if (mountedRef.current) setThinkingText(thinkingRef.current);
        },
        onOutputTranscript: (text) => {
          spokenRef.current += text;
          if (mountedRef.current) setOutputTranscript(spokenRef.current);
        },
        onInputTranscript: () => { /* handled by local STT */ },
        onModelTurnStarted: () => {
          spokenRef.current = "";
          thinkingRef.current = "";
          console.info("[voice-rag] Gemini turn started");
          setVoiceState("thinking");
          if (mountedRef.current) {
            setOutputTranscript("");
            setThinkingText("");
            setCompletedTurn(null);
          }
        },
        onTurnComplete: () => {
          console.info("[voice-rag] Gemini turn complete, waiting for audio drain");
          pendingTurnCompleteRef.current = true;
          // Safety: if audio doesn't drain in 2s, force finalize
          drainTimerRef.current = setTimeout(() => {
            pendingTurnCompleteRef.current = false;
            const finalizedTranscript = spokenRef.current.trim();
            const finalizedThinking = thinkingRef.current.trim();
            spokenRef.current = "";

            if (mountedRef.current) {
              setCompletedTurn({
                id: ++turnIdRef.current,
                transcript: finalizedTranscript,
                thinkingText: finalizedThinking,
              });
            }
            console.info("[voice-rag] Gemini turn finalized", {
              transcriptChars: finalizedTranscript.length,
              thinkingChars: finalizedThinking.length,
            });
            setVoiceState("listening");
          }, 2000);
        },
        onInterrupted: () => {
          console.info("[voice-rag] Gemini playback interrupted");
          interruptPlayback();
          spokenRef.current = "";
          thinkingRef.current = "";
          if (mountedRef.current) {
            setCompletedTurn(null);
            setOutputTranscript("");
            setThinkingText("");
          }
          setVoiceState("listening");
        },
        onError: (err) => {
          console.error("[gemini-live-voice] Error:", err);
          if (mountedRef.current) setIsConnected(false);
          setVoiceState("idle");
        },
      };

      ws.onopen = () => {
        // Send setup message
        ws.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt || "" }],
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
                endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
                prefixPaddingMs: 200,
                silenceDurationMs: 2000,
              },
            },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
        }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          handleMessage(JSON.parse(event.data), callbacks);
        } else if (event.data instanceof Blob) {
          event.data.text().then((text) => {
            handleMessage(JSON.parse(text), callbacks);
          });
        }
      };

      ws.onerror = (err) => callbacks.onError(err);
      ws.onclose = () => {
        setupDoneRef.current = false;
        wsRef.current = null;
        console.info("[voice-rag] Gemini Live closed");
        if (mountedRef.current) setIsConnected(false);
        setVoiceState("idle");
      };
    } catch (err) {
      console.error("[gemini-live-voice] Connection failed:", err);
      setVoiceState("idle");
    }
  }, [tokenEndpoint, initPlayback, initCapture, playAudioChunk, interruptPlayback, handleMessage, setVoiceState]);

  const disconnect = useCallback(() => {
    // WebSocket
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setupDoneRef.current = false;

    // Capture cleanup
    if (captureRafRef.current) { cancelAnimationFrame(captureRafRef.current); captureRafRef.current = null; }
    captureAnalyserRef.current?.disconnect();
    captureWorkletRef.current?.disconnect();
    captureSourceRef.current?.disconnect();
    captureStreamRef.current?.getTracks().forEach((t) => t.stop());
    captureCtxRef.current?.close();
    captureCtxRef.current = null; captureStreamRef.current = null;
    captureSourceRef.current = null; captureWorkletRef.current = null;
    captureAnalyserRef.current = null;

    // Playback cleanup
    playbackWorkletRef.current?.disconnect();
    playbackAnalyserRef.current?.disconnect();
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null; playbackWorkletRef.current = null;
    playbackAnalyserRef.current = null;

    // Timers
    if (drainTimerRef.current) { clearTimeout(drainTimerRef.current); drainTimerRef.current = null; }

    setIsConnected(false);
    setPlaybackAnalyser(null);
    setMicVolume(0);
    setOutputTranscript("");
    setThinkingText("");
    setCompletedTurn(null);
    setVoiceState("idle");
    spokenRef.current = "";
    thinkingRef.current = "";
    micRoutingRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendText,
    outputTranscript,
    thinkingText,
    completedTurn,
    playbackAnalyser,
    micVolume,
    isConnected,
  };
}
