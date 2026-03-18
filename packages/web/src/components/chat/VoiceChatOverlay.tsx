"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  useAudioCapture,
  useAudioPlayback,
  VoiceMicButton,
  AudioVisualizer,
  VoiceTranscript,
  type VoiceState,
  type TranscriptEntry,
} from "@optimitron/chat-ui";
import { VoiceSession } from "@/lib/voice-session";

/**
 * Voice chat overlay — progressive enhancement on top of the existing text chat.
 *
 * State machine: idle -> connecting -> listening -> thinking -> speaking -> listening
 *
 * Wires useAudioCapture (mic), useAudioPlayback (speaker), VoiceSession (Gemini Live API),
 * and transcript display into a single overlay component.
 */
export default function VoiceChatOverlay({ onClose }: { onClose: () => void }) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<VoiceSession | null>(null);

  const { enqueueAudio, isPlaying, analyserNode: playbackAnalyser, stop: stopPlayback } =
    useAudioPlayback();

  const stopPlaybackRef = useRef(stopPlayback);
  useEffect(() => {
    stopPlaybackRef.current = stopPlayback;
  }, [stopPlayback]);

  const handleAudioChunk = useCallback(
    (chunk: ArrayBuffer) => {
      sessionRef.current?.sendAudio(chunk);
    },
    [],
  );

  const { start: startCapture, stop: stopCapture, isCapturing, analyserNode: captureAnalyser } =
    useAudioCapture({ onAudioChunk: handleAudioChunk });

  // Initialize voice session with callbacks
  useEffect(() => {
    const session = new VoiceSession({
      onStateChange: setVoiceState,
      onAudioChunk: enqueueAudio,
      onTranscript: setTranscript,
      onError: setError,
      onInterrupted: () => {
        stopPlaybackRef.current();
      },
    });
    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, [enqueueAudio]);

  const handleMicClick = useCallback(async () => {
    if (voiceState === "idle" || voiceState === "error") {
      // Start voice session
      setError(null);
      const session = sessionRef.current;
      if (!session) return;

      await session.connect();
      await startCapture();
    } else if (voiceState === "listening" || voiceState === "speaking") {
      // Stop voice session
      stopCapture();
      stopPlayback();
      sessionRef.current?.disconnect();
      setVoiceState("idle");
    }
  }, [voiceState, startCapture, stopCapture, stopPlayback]);

  const handleClose = useCallback(() => {
    stopCapture();
    stopPlayback();
    sessionRef.current?.disconnect();
    onClose();
  }, [onClose, stopCapture, stopPlayback]);

  // Show the active analyser based on state
  const activeAnalyser = isPlaying ? playbackAnalyser : isCapturing ? captureAnalyser : null;
  const isReconnecting = voiceState === "connecting" && (error?.includes("Reconnecting") ?? false);

  return (
    <div className="opto-voice-overlay">
      <div className="opto-voice-overlay__backdrop" onClick={handleClose} />

      <div className="opto-voice-overlay__panel">
        <div className="opto-voice-overlay__header">
          <h3 className="opto-voice-overlay__title">TALK TO WISHONIA</h3>
          <button
            className="opto-voice-overlay__close"
            onClick={handleClose}
            aria-label="Close voice chat"
            type="button"
          >
            X
          </button>
        </div>

        <div className="opto-voice-overlay__body">
          <AudioVisualizer
            analyserNode={activeAnalyser}
            width={280}
            height={50}
            color={isPlaying ? "var(--brutal-cyan, #00e5ff)" : "var(--brutal-pink, #ff4081)"}
          />

          <VoiceMicButton
            state={voiceState}
            onClick={() => void handleMicClick()}
          />

          {isReconnecting && (
            <div className="opto-voice-overlay__reconnecting" role="status">
              Reconnecting...
            </div>
          )}

          {error && !isReconnecting && (
            <div className="opto-voice-overlay__error" role="alert">
              {error}
            </div>
          )}

          <VoiceTranscript entries={transcript} />
        </div>
      </div>
    </div>
  );
}
