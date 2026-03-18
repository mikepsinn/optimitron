import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI, Modality } from '@google/genai';
import { resolveGeminiApiKey } from './gemini.js';

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

export const RETRO_SCIENTIFIC_ILLUSTRATION_STYLE = [
  'Create an image with a fun retro scientific illustration style.',
].join(' ');

export type GeminiImageAspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9'
  | '1:8'
  | '8:1'
  | '1:4'
  | '4:1';

export type GeminiImageSize = '512' | '1K' | '2K' | '4K';

export interface GeminiImageInlineDataLike {
  data?: string;
  mimeType?: string;
}

export interface GeminiImagePartLike {
  inlineData?: GeminiImageInlineDataLike;
  text?: string;
}

export interface GeminiImageResponseLike {
  candidates?: Array<{
    content?: {
      parts?: GeminiImagePartLike[];
    };
  }>;
}

export interface GeminiImageClientLike {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config: {
        responseModalities: Modality[];
        imageConfig: {
          aspectRatio?: GeminiImageAspectRatio;
          imageSize?: GeminiImageSize;
        };
      };
    }): Promise<GeminiImageResponseLike>;
  };
}

export interface GenerateRetroScientificIllustrationOptions {
  apiKey?: string;
  aspectRatio?: GeminiImageAspectRatio;
  client?: GeminiImageClientLike;
  extraStyleDirectives?: string[];
  imageSize?: GeminiImageSize;
  model?: string;
  prompt: string;
}

export interface GeneratedGeminiImageAsset {
  base64: string;
  bytes: Buffer;
  mimeType: string;
}

export interface GeneratedRetroScientificIllustration {
  generatedAt: string;
  images: GeneratedGeminiImageAsset[];
  model: string;
  prompt: string;
  styledPrompt: string;
  textResponse?: string;
}

export interface WriteGeneratedImageAssetsOptions {
  directory: string;
  fileStem: string;
  includeMetadata?: boolean;
  result: GeneratedRetroScientificIllustration;
}

export interface WrittenGeneratedImageAsset {
  byteLength: number;
  metadataPath?: string;
  mimeType: string;
  path: string;
}

export function createGeminiImageClient(apiKey: string): GeminiImageClientLike {
  return new GoogleGenAI({ apiKey }) as unknown as GeminiImageClientLike;
}

export function buildRetroScientificIllustrationPrompt(
  prompt: string,
  extraStyleDirectives: string[] = [],
): string {
  const directives = extraStyleDirectives.length > 0
    ? `Additional art direction: ${extraStyleDirectives.join(' ')}`
    : '';

  return [prompt.trim(), '', RETRO_SCIENTIFIC_ILLUSTRATION_STYLE, directives]
    .filter((part) => part.length > 0)
    .join('\n');
}

function responseParts(response: GeminiImageResponseLike): GeminiImagePartLike[] {
  return response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];
}

function responseText(parts: GeminiImagePartLike[]): string | undefined {
  const text = parts
    .map((part) => part.text?.trim())
    .filter((value): value is string => Boolean(value))
    .join('\n')
    .trim();

  return text.length > 0 ? text : undefined;
}

function responseImages(parts: GeminiImagePartLike[]): GeneratedGeminiImageAsset[] {
  return parts.flatMap((part) => {
    const data = part.inlineData?.data;
    const mimeType = part.inlineData?.mimeType;

    if (!data || !mimeType) {
      return [];
    }

    return [{
      base64: data,
      bytes: Buffer.from(data, 'base64'),
      mimeType,
    }];
  });
}

function imageExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      throw new Error(`Unsupported Gemini image MIME type: ${mimeType}`);
  }
}

function assetFileName(
  fileStem: string,
  index: number,
  mimeType: string,
): string {
  return `${fileStem}-${index + 1}.${imageExtensionFromMimeType(mimeType)}`;
}

export async function generateRetroScientificIllustration(
  options: GenerateRetroScientificIllustrationOptions,
): Promise<GeneratedRetroScientificIllustration> {
  const apiKey = resolveGeminiApiKey(options.apiKey);
  const client = options.client ?? createGeminiImageClient(apiKey);
  const model = options.model
    ?? process.env['OPTIMITRON_AGENT_IMAGE_MODEL']
    ?? DEFAULT_GEMINI_IMAGE_MODEL;
  const styledPrompt = buildRetroScientificIllustrationPrompt(
    options.prompt,
    options.extraStyleDirectives,
  );

  const response = await client.models.generateContent({
    model,
    contents: styledPrompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: {
        aspectRatio: options.aspectRatio ?? '1:1',
        imageSize: options.imageSize ?? '1K',
      },
    },
  });

  const parts = responseParts(response);
  const images = responseImages(parts);

  if (images.length === 0) {
    throw new Error('Gemini image response did not contain image output');
  }

  return {
    generatedAt: new Date().toISOString(),
    images,
    model,
    prompt: options.prompt,
    styledPrompt,
    textResponse: responseText(parts),
  };
}

export async function writeGeneratedImageAssets(
  options: WriteGeneratedImageAssetsOptions,
): Promise<WrittenGeneratedImageAsset[]> {
  await mkdir(options.directory, { recursive: true });

  const writtenAssets = await Promise.all(
    options.result.images.map(async (image, index) => {
      const filePath = path.join(
        options.directory,
        assetFileName(options.fileStem, index, image.mimeType),
      );

      await writeFile(filePath, image.bytes);
      return {
        byteLength: image.bytes.byteLength,
        mimeType: image.mimeType,
        path: filePath,
      };
    }),
  );

  if (options.includeMetadata === false) {
    return writtenAssets;
  }

  const metadataPath = path.join(options.directory, `${options.fileStem}.json`);
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        ...options.result,
        images: writtenAssets.map(({ byteLength, mimeType, path: assetPath }) => ({
          byteLength,
          mimeType,
          path: assetPath,
        })),
      },
      null,
      2,
    ),
    'utf8',
  );

  return writtenAssets.map((asset) => ({
    ...asset,
    metadataPath,
  }));
}
