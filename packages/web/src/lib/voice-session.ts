import {
  GoogleGenAI,
  type Session,
  type LiveServerMessage,
} from '@google/genai';
import type { VoiceState } from '@optomitron/chat-ui';
import { VOICE_MODEL } from './voice-config';
import { API_ROUTES } from './api-routes';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  partial?: boolean;
}

export interface VoiceSessionCallbacks {
  onStateChange: (state: VoiceState) => void;
  onAudioChunk: (pcmData: ArrayBuffer) => void;
  onTranscript: (entries: TranscriptEntry[]) => void;
  onError: (error: string) => void;
  onInterrupted: () => void;
}

interface TokenResponse {
  token: string;
  model: string;
}

interface RAGResponse {
  context: string;
  citations: unknown[];
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Core orchestrator for Gemini Live API voice sessions.
 *
 * Flow:
 * 1. Fetches ephemeral token from /api/voice/token
 * 2. Connects to Gemini Live API via ai.live.connect()
 * 3. Streams mic audio to the session
 * 4. Handles audio responses (playback + transcript)
 * 5. Intercepts toolCall for RAG (retrieveContext)
 * 6. Manages session lifecycle + reconnection
 */
export class VoiceSession {
  private session: Session | null = null;
  private callbacks: VoiceSessionCallbacks;
  private transcriptEntries: TranscriptEntry[] = [];
  private isConnected = false;

  // Session resumption
  private resumeHandle: string | null = null;
  private cachedToken: string | null = null;

  // Auto-reconnect
  private reconnectAttempts = 0;
  private shouldReconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: VoiceSessionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to the Gemini Live API using an ephemeral token.
   */
  async connect(): Promise<void> {
    this.callbacks.onStateChange('connecting');
    this.shouldReconnect = true;

    try {
      // Fetch ephemeral token (reuse cached token for reconnection)
      const token = this.cachedToken ?? await this.fetchToken();
      this.cachedToken = token;

      // Connect to Gemini Live API with the ephemeral token
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const connectConfig: Record<string, unknown> = {};
      if (this.resumeHandle) {
        connectConfig.sessionResumption = { handle: this.resumeHandle };
      }

      this.session = await ai.live.connect({
        model: VOICE_MODEL,
        config: connectConfig,
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.callbacks.onStateChange('listening');
          },
          onmessage: (message: LiveServerMessage) => {
            void this.handleMessage(message);
          },
          onerror: (error: ErrorEvent) => {
            this.callbacks.onError(error.message ?? 'Live API connection error');
            this.callbacks.onStateChange('error');
          },
          onclose: () => {
            this.isConnected = false;
            if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              this.scheduleReconnect();
            } else {
              this.callbacks.onStateChange('idle');
            }
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      this.callbacks.onError(msg);

      if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
      } else {
        this.callbacks.onStateChange('error');
      }
    }
  }

  /**
   * Send a 16kHz PCM audio chunk to the Live API.
   */
  sendAudio(pcmData: ArrayBuffer): void {
    if (!this.session || !this.isConnected) return;

    // Convert Int16 PCM to base64 for the Live API
    const bytes = new Uint8Array(pcmData);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    const base64 = btoa(binary);

    void this.session.sendRealtimeInput({
      media: {
        data: base64,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }

  /**
   * Disconnect the session and clean up. Prevents auto-reconnect.
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.isConnected = false;
    this.transcriptEntries = [];
    this.resumeHandle = null;
    this.cachedToken = null;
    this.reconnectAttempts = 0;
    this.callbacks.onStateChange('idle');
  }

  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming messages from the Live API.
   */
  private async handleMessage(message: LiveServerMessage): Promise<void> {
    // Session resumption handle updates
    if (message.sessionResumptionUpdate?.newHandle) {
      this.resumeHandle = message.sessionResumptionUpdate.newHandle;
    }

    // Handle tool calls (RAG)
    if (message.toolCall?.functionCalls) {
      this.callbacks.onStateChange('thinking');

      for (const call of message.toolCall.functionCalls) {
        if (call.name === 'retrieveContext') {
          const args = call.args as Record<string, string> | undefined;
          const ragResult = await this.handleRAG(args?.query ?? '');

          if (this.session) {
            void this.session.sendToolResponse({
              functionResponses: [
                {
                  id: call.id ?? '',
                  name: call.name ?? 'retrieveContext',
                  response: { context: ragResult.context },
                },
              ],
            });
          }
        }
      }
      return;
    }

    // Handle server content (audio + text + transcription)
    if (message.serverContent) {
      const content = message.serverContent;

      // Barge-in: server signals the model was interrupted
      if (content.interrupted) {
        this.callbacks.onInterrupted();
        this.callbacks.onStateChange('listening');
        return;
      }

      // Input transcription (user's speech)
      if (content.inputTranscription?.text) {
        const inputText = content.inputTranscription.text;
        const inputFinished = content.inputTranscription.finished ?? false;
        const lastEntry = this.transcriptEntries[this.transcriptEntries.length - 1];
        if (lastEntry?.role === 'user' && lastEntry.partial) {
          lastEntry.text = inputText;
          if (inputFinished) {
            lastEntry.partial = false;
          }
        } else {
          this.transcriptEntries.push({
            role: 'user',
            text: inputText,
            partial: !inputFinished,
          });
        }
        this.callbacks.onTranscript([...this.transcriptEntries]);
      }

      // Output transcription (model's spoken words)
      if (content.outputTranscription?.text) {
        const outputText = content.outputTranscription.text;
        const outputFinished = content.outputTranscription.finished ?? false;
        const lastEntry = this.transcriptEntries[this.transcriptEntries.length - 1];
        if (lastEntry?.role === 'assistant' && lastEntry.partial) {
          lastEntry.text = outputText;
          if (outputFinished) {
            lastEntry.partial = false;
          }
        } else {
          this.transcriptEntries.push({
            role: 'assistant',
            text: outputText,
            partial: !outputFinished,
          });
        }
        this.callbacks.onTranscript([...this.transcriptEntries]);
      }

      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          // Audio response
          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            this.callbacks.onStateChange('speaking');
            const data = part.inlineData.data;
            if (data) {
              const audioBytes = Uint8Array.from(atob(data), (c) =>
                c.charCodeAt(0),
              );
              this.callbacks.onAudioChunk(audioBytes.buffer);
            }
          }

          // Text from modelTurn (thinking text — only use if no outputTranscription)
          if (part.text && !content.outputTranscription?.text) {
            const lastEntry = this.transcriptEntries[this.transcriptEntries.length - 1];
            if (lastEntry?.role === 'assistant' && lastEntry.partial) {
              lastEntry.text += part.text;
            } else {
              this.transcriptEntries.push({
                role: 'assistant',
                text: part.text,
                partial: true,
              });
            }
            this.callbacks.onTranscript([...this.transcriptEntries]);
          }
        }
      }

      if (content.turnComplete) {
        // Mark the last assistant entry as complete
        const lastEntry = this.transcriptEntries[this.transcriptEntries.length - 1];
        if (lastEntry?.role === 'assistant') {
          lastEntry.partial = false;
        }
        this.callbacks.onTranscript([...this.transcriptEntries]);
        this.callbacks.onStateChange('listening');
      }
    }
  }

  /**
   * Fetch an ephemeral token from the server.
   */
  private async fetchToken(): Promise<string> {
    const tokenRes = await fetch(API_ROUTES.voice.token, { method: 'POST' });
    if (!tokenRes.ok) {
      const err = (await tokenRes.json()) as { error?: string };
      throw new Error(err.error ?? `Token request failed: ${tokenRes.status}`);
    }
    const { token } = (await tokenRes.json()) as TokenResponse;
    return token;
  }

  /**
   * Schedule an auto-reconnect with exponential backoff.
   */
  private scheduleReconnect(): void {
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;
    this.callbacks.onStateChange('connecting');
    this.callbacks.onError(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  /**
   * Call the RAG endpoint to retrieve context for a tool call.
   */
  private async handleRAG(query: string): Promise<RAGResponse> {
    try {
      const res = await fetch(API_ROUTES.voice.rag, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        return { context: 'Unable to retrieve context at this time.', citations: [] };
      }

      return (await res.json()) as RAGResponse;
    } catch {
      return { context: 'RAG retrieval failed.', citations: [] };
    }
  }
}
