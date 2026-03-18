import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Modality } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GEMINI_IMAGE_MODEL,
  RETRO_SCIENTIFIC_ILLUSTRATION_STYLE,
  buildRetroScientificIllustrationPrompt,
  generateRetroScientificIllustration,
  writeGeneratedImageAssets,
} from '../image-generation.js';

describe('image generation helpers', () => {
  it('builds the retro scientific illustration prompt wrapper', () => {
    const prompt = buildRetroScientificIllustrationPrompt(
      'Illustrate a budget feedback loop.',
      ['Use diagram arrows and labeled inputs.'],
    );

    expect(prompt).toContain('Illustrate a budget feedback loop.');
    expect(prompt).toContain(RETRO_SCIENTIFIC_ILLUSTRATION_STYLE);
    expect(prompt).toContain('Use diagram arrows and labeled inputs.');
  });

  it('generates retro scientific illustrations from Gemini image output', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { text: 'A labeled systems diagram.' },
              {
                inlineData: {
                  data: Buffer.from('retro-image').toString('base64'),
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    const result = await generateRetroScientificIllustration({
      apiKey: 'test-key',
      client: {
        models: {
          generateContent,
        },
      },
      prompt: 'Draw a map of incentives around city transit.',
      extraStyleDirectives: ['Include tiny legend boxes.'],
      aspectRatio: '16:9',
      imageSize: '2K',
    });

    expect(result.model).toBe(DEFAULT_GEMINI_IMAGE_MODEL);
    expect(result.textResponse).toBe('A labeled systems diagram.');
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.mimeType).toBe('image/png');
    expect(result.images[0]?.bytes.toString('utf8')).toBe('retro-image');
    expect(result.styledPrompt).toContain('Include tiny legend boxes.');
    expect(generateContent).toHaveBeenCalledWith({
      model: DEFAULT_GEMINI_IMAGE_MODEL,
      contents: result.styledPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '2K',
        },
      },
    });
  });

  it('uses the image model override env var when present', async () => {
    const original = process.env['OPTIMITRON_AGENT_IMAGE_MODEL'];
    process.env['OPTIMITRON_AGENT_IMAGE_MODEL'] = 'gemini-override';
    const generateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: Buffer.from('retro-image').toString('base64'),
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    try {
      await generateRetroScientificIllustration({
        apiKey: 'test-key',
        client: {
          models: {
            generateContent,
          },
        },
        prompt: 'Draw a planetary dashboard.',
      });

      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-override' }),
      );
    } finally {
      if (original !== undefined) {
        process.env['OPTIMITRON_AGENT_IMAGE_MODEL'] = original;
      } else {
        delete process.env['OPTIMITRON_AGENT_IMAGE_MODEL'];
      }
    }
  });

  it('throws when Gemini returns no image data', async () => {
    await expect(
      generateRetroScientificIllustration({
        apiKey: 'test-key',
        client: {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              candidates: [{ content: { parts: [{ text: 'No image here.' }] } }],
            }),
          },
        },
        prompt: 'Draw a welfare function.',
      }),
    ).rejects.toThrow('Gemini image response did not contain image output');
  });

  it('writes generated image assets and metadata to disk', async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'optimitron-agent-image-'),
    );
    const written = await writeGeneratedImageAssets({
      directory,
      fileStem: 'hero-systems-map',
      result: {
        generatedAt: '2026-03-13T00:00:00.000Z',
        model: DEFAULT_GEMINI_IMAGE_MODEL,
        prompt: 'Draw a city transit control panel.',
        styledPrompt: 'styled prompt',
        textResponse: 'A retro diagram.',
        images: [
          {
            base64: Buffer.from('png-bytes').toString('base64'),
            bytes: Buffer.from('png-bytes'),
            mimeType: 'image/png',
          },
        ],
      },
    });

    expect(written).toHaveLength(1);
    expect(written[0]?.path.endsWith('hero-systems-map-1.png')).toBe(true);
    expect(written[0]?.metadataPath?.endsWith('hero-systems-map.json')).toBe(true);

    const assetBytes = await readFile(written[0]!.path, 'utf8');
    const metadataRaw = await readFile(written[0]!.metadataPath!, 'utf8');
    const metadata = JSON.parse(metadataRaw) as {
      model: string;
      images: Array<{ path: string; byteLength: number }>;
    };

    expect(assetBytes).toBe('png-bytes');
    expect(metadata.model).toBe(DEFAULT_GEMINI_IMAGE_MODEL);
    expect(metadata.images[0]?.path).toBe(written[0]?.path);
    expect(metadata.images[0]?.byteLength).toBe(9);
  });
});
