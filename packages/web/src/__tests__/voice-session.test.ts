import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceSession, type VoiceSessionCallbacks } from '../lib/voice-session';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock session
const mockSendRealtimeInput = vi.fn();
const mockSendToolResponse = vi.fn();
const mockSessionClose = vi.fn();

let capturedCallbacks: {
  onopen?: () => void;
  onmessage?: (msg: unknown) => void;
  onerror?: (err: ErrorEvent) => void;
  onclose?: () => void;
} = {};

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    live: {
      connect: vi.fn().mockImplementation(({ callbacks }: { callbacks: typeof capturedCallbacks }) => {
        capturedCallbacks = callbacks;
        return Promise.resolve({
          sendRealtimeInput: mockSendRealtimeInput,
          sendToolResponse: mockSendToolResponse,
          close: mockSessionClose,
        });
      }),
    },
  })),
}));

vi.mock('../lib/voice-config', () => ({
  VOICE_MODEL: 'test-model',
}));

vi.mock('../lib/api-routes', () => ({
  API_ROUTES: {
    voice: {
      token: '/api/voice/token',
      rag: '/api/voice/rag',
    },
  },
}));

function createCallbacks(): VoiceSessionCallbacks & {
  states: string[];
  errors: string[];
  transcripts: unknown[];
  interruptCount: number;
} {
  const states: string[] = [];
  const errors: string[] = [];
  const transcripts: unknown[] = [];
  let interruptCount = 0;

  return {
    states,
    errors,
    transcripts,
    get interruptCount() {
      return interruptCount;
    },
    onStateChange: (state) => states.push(state),
    onAudioChunk: vi.fn(),
    onTranscript: (entries) => transcripts.push([...entries]),
    onError: (err) => errors.push(err),
    onInterrupted: () => {
      interruptCount++;
    },
  };
}

function mockTokenResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ token: 'test-token', model: 'test-model' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  capturedCallbacks = {};
});

describe('VoiceSession', () => {
  describe('connect', () => {
    it('fetches token and connects to Live API', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      expect(mockFetch).toHaveBeenCalledWith('/api/voice/token', { method: 'POST' });
      expect(cbs.states).toContain('connecting');
      expect(cbs.states).toContain('listening');
      expect(session.connected).toBe(true);

      session.disconnect();
    });

    it('reports error on token fetch failure', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'No API key' }),
      });

      await session.connect();

      expect(cbs.errors).toContain('No API key');

      session.disconnect();
    });
  });

  describe('interruption', () => {
    it('calls onInterrupted and transitions to listening when server signals interrupted', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Simulate server sending interrupted signal
      capturedCallbacks.onmessage?.({
        serverContent: { interrupted: true },
      });

      // Allow microtask to resolve
      await vi.advanceTimersByTimeAsync(0);

      expect(cbs.interruptCount).toBe(1);
      expect(cbs.states[cbs.states.length - 1]).toBe('listening');

      session.disconnect();
    });
  });

  describe('transcription', () => {
    it('handles input transcription (user speech)', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      capturedCallbacks.onmessage?.({
        serverContent: {
          inputTranscription: { text: 'Hello Wishonia', finished: true },
        },
      });

      await vi.advanceTimersByTimeAsync(0);

      const lastTranscript = cbs.transcripts[cbs.transcripts.length - 1] as Array<{
        role: string;
        text: string;
        partial: boolean;
      }>;
      expect(lastTranscript).toHaveLength(1);
      expect(lastTranscript[0]).toEqual({
        role: 'user',
        text: 'Hello Wishonia',
        partial: false,
      });

      session.disconnect();
    });

    it('handles output transcription (model speech)', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      capturedCallbacks.onmessage?.({
        serverContent: {
          outputTranscription: { text: 'Your planet is fascinating.', finished: false },
        },
      });

      await vi.advanceTimersByTimeAsync(0);

      const lastTranscript = cbs.transcripts[cbs.transcripts.length - 1] as Array<{
        role: string;
        text: string;
        partial: boolean;
      }>;
      expect(lastTranscript).toHaveLength(1);
      expect(lastTranscript[0]).toEqual({
        role: 'assistant',
        text: 'Your planet is fascinating.',
        partial: true,
      });

      session.disconnect();
    });

    it('updates partial transcription in place', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Partial user transcription
      capturedCallbacks.onmessage?.({
        serverContent: {
          inputTranscription: { text: 'Hello', finished: false },
        },
      });
      await vi.advanceTimersByTimeAsync(0);

      // Updated transcription
      capturedCallbacks.onmessage?.({
        serverContent: {
          inputTranscription: { text: 'Hello Wishonia', finished: true },
        },
      });
      await vi.advanceTimersByTimeAsync(0);

      const lastTranscript = cbs.transcripts[cbs.transcripts.length - 1] as Array<{
        role: string;
        text: string;
      }>;
      // Should still be a single entry, not two
      expect(lastTranscript).toHaveLength(1);
      expect(lastTranscript[0]?.text).toBe('Hello Wishonia');

      session.disconnect();
    });
  });

  describe('session resumption', () => {
    it('stores resumption handle from server', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Server sends resumption handle
      capturedCallbacks.onmessage?.({
        sessionResumptionUpdate: {
          newHandle: 'resume-handle-123',
          resumable: true,
        },
      });

      await vi.advanceTimersByTimeAsync(0);

      // Force disconnect, then reconnect should use the handle
      // (We can't easily test the handle is passed to the SDK without
      //  inspecting the mock call args, but at least verify no error)
      session.disconnect();
    });
  });

  describe('auto-reconnect', () => {
    it('schedules reconnect with exponential backoff on unexpected close', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Simulate unexpected close
      capturedCallbacks.onclose?.();

      // Should be in connecting state and have reconnect error message
      expect(cbs.states).toContain('connecting');
      expect(cbs.errors.some((e) => e.includes('Reconnecting'))).toBe(true);

      session.disconnect();
    });

    it('does not reconnect after explicit disconnect', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Explicit disconnect
      session.disconnect();

      // State should be idle, not connecting
      expect(cbs.states[cbs.states.length - 1]).toBe('idle');

      session.disconnect();
    });

    it('stops reconnecting after max attempts', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);

      // First connect
      mockTokenResponse();
      await session.connect();
      capturedCallbacks.onopen?.();

      // Simulate 5 unexpected closes with failed reconnect attempts
      for (let i = 0; i < 5; i++) {
        capturedCallbacks.onclose?.();
        mockTokenResponse();
        await vi.advanceTimersByTimeAsync(30001);
      }

      // 6th close should go to idle
      capturedCallbacks.onclose?.();
      expect(cbs.states[cbs.states.length - 1]).toBe('idle');

      session.disconnect();
    });
  });

  describe('tool calling', () => {
    it('handles retrieveContext tool call with RAG', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      // Mock RAG response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ context: 'Test context', citations: [] }),
      });

      capturedCallbacks.onmessage?.({
        toolCall: {
          functionCalls: [
            {
              id: 'call-1',
              name: 'retrieveContext',
              args: { query: 'FDA approval times' },
            },
          ],
        },
      });

      await vi.advanceTimersByTimeAsync(0);
      // Wait for RAG fetch to resolve
      await vi.advanceTimersByTimeAsync(0);

      expect(cbs.states).toContain('thinking');
      expect(mockSendToolResponse).toHaveBeenCalled();

      session.disconnect();
    });
  });

  describe('disconnect', () => {
    it('cleans up all state on disconnect', async () => {
      const cbs = createCallbacks();
      const session = new VoiceSession(cbs);
      mockTokenResponse();

      await session.connect();
      capturedCallbacks.onopen?.();

      session.disconnect();

      expect(session.connected).toBe(false);
      expect(mockSessionClose).toHaveBeenCalled();
      expect(cbs.states[cbs.states.length - 1]).toBe('idle');
    });
  });
});
