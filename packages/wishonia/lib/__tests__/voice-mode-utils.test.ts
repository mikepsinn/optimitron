import { describe, expect, it } from "vitest";
import {
  getVoiceInputPlaceholder,
  shouldForwardMicAudio,
  shouldResumeVoiceInput,
} from "../voice-mode-utils";

describe("voice-mode-utils", () => {
  it("keeps the default placeholder outside voice mode", () => {
    expect(getVoiceInputPlaceholder(false, "idle")).toBe(
      "Ask Wishonia anything..."
    );
  });

  it("shows stable voice placeholders by voice state", () => {
    expect(getVoiceInputPlaceholder(true, "connecting")).toBe(
      "Connecting voice mode..."
    );
    expect(getVoiceInputPlaceholder(true, "listening")).toBe("Listening...");
    expect(getVoiceInputPlaceholder(true, "thinking")).toBe(
      "Wishonia is thinking..."
    );
    expect(getVoiceInputPlaceholder(true, "speaking")).toBe(
      "Wishonia is speaking..."
    );
  });

  it("matches transmit mic forwarding rules", () => {
    expect(shouldForwardMicAudio(false, "listening")).toBe(true);
    expect(shouldForwardMicAudio(true, "listening")).toBe(false);
    expect(shouldForwardMicAudio(true, "thinking")).toBe(true);
    expect(shouldForwardMicAudio(true, "speaking")).toBe(true);
  });

  it("only resumes local speech recognition on transitions back to listening", () => {
    expect(shouldResumeVoiceInput(true, "thinking", "listening")).toBe(true);
    expect(shouldResumeVoiceInput(true, "listening", "listening")).toBe(false);
    expect(shouldResumeVoiceInput(false, "thinking", "listening")).toBe(false);
  });
});
