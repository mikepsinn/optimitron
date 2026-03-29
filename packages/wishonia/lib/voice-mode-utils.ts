export type VoiceSessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

export function getVoiceInputPlaceholder(
  isVoiceModeActive: boolean,
  voiceState: VoiceSessionState
): string {
  if (!isVoiceModeActive) return "Ask Wishonia anything...";
  if (voiceState === "connecting") return "Connecting voice mode...";
  if (voiceState === "thinking") return "Wishonia is thinking...";
  if (voiceState === "speaking") return "Wishonia is speaking...";
  return "Listening...";
}

export function shouldForwardMicAudio(
  hasLocalSpeechRecognition: boolean,
  voiceState: VoiceSessionState
): boolean {
  if (!hasLocalSpeechRecognition) return true;
  return voiceState === "thinking" || voiceState === "speaking";
}

export function shouldResumeVoiceInput(
  isVoiceModeActive: boolean,
  previousVoiceState: VoiceSessionState | null,
  nextVoiceState: VoiceSessionState
): boolean {
  return (
    isVoiceModeActive &&
    nextVoiceState === "listening" &&
    previousVoiceState !== "listening"
  );
}
