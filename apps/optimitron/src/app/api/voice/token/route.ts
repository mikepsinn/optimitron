import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { serverEnv } from '@/lib/env';
import {
  VOICE_MODEL,
  WISHONIA_VOICE_SYSTEM_PROMPT,
  RETRIEVE_CONTEXT_DECLARATION,
  StartSensitivity,
  EndSensitivity,
  ActivityHandling,
} from '@/lib/voice-config';

/**
 * POST /api/voice/token
 *
 * Creates an ephemeral token for the Gemini Live API.
 * The token locks in the model, system prompt, modalities, and tools
 * so the browser cannot override them. API key never leaves the server.
 */
export async function POST() {
  const apiKey = serverEnv.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' },
      { status: 500 },
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const token = await ai.authTokens.create({
      config: {
        uses: 3, // Allow reconnection reuse
        liveConnectConstraints: {
          model: VOICE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO, Modality.TEXT],
            systemInstruction: WISHONIA_VOICE_SYSTEM_PROMPT,
            tools: [
              {
                functionDeclarations: [RETRIEVE_CONTEXT_DECLARATION],
              },
            ],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore',
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
                silenceDurationMs: 1000,
              },
              activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
            },
            sessionResumption: { transparent: true },
            contextWindowCompression: {
              slidingWindow: { targetTokens: '20000' },
            },
            enableAffectiveDialog: true,
          },
        },
      },
    });

    return NextResponse.json({
      token: token.name,
      model: VOICE_MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create ephemeral token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
