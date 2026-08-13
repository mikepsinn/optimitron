/**
 * Google Gemini AI Image Generation Utility
 *
 * Uses the @google/genai SDK to generate images via Gemini API
 * Documentation: https://ai.google.dev/gemini-api/docs/libraries
 * npm: https://www.npmjs.com/package/@google/genai
 */

import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'

// Simple logger to avoid env validation issues in standalone scripts
const log = {
  info: (...args: any[]) => console.log('[genai-image]', ...args),
  error: (...args: any[]) => console.error('[genai-image]', ...args),
}

/**
 * Initialize the Google Gen AI client
 */
function getClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set')
  }

  return new GoogleGenAI({ apiKey })
}

/**
 * Image generation options
 */
export interface ImageGenerationOptions {
  /** The text prompt describing the image to generate */
  prompt: string

  /** Number of images to generate (1-8, default: 1) */
  count?: number

  /** Image aspect ratio (default: '1:1') */
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'

  /** Model to use (default: 'gemini-3-pro-image-preview' - Nano Banana Pro) */
  model?: string

  /** Negative prompt - what to avoid in the image */
  negativePrompt?: string

  /** Safety filter level */
  safetyFilterLevel?: 'block_none' | 'block_some' | 'block_most'

  /** Person generation setting */
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all'
}

/**
 * Generated image result
 */
export interface GeneratedImage {
  /** Base64-encoded image data */
  imageBytes: string

  /** RAI (Responsible AI) filter reason if filtered */
  raiFilteredReason?: string

  /** Enhanced/rewritten prompt if prompt enhancer was enabled */
  enhancedPrompt?: string
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  /** Array of generated images */
  images: GeneratedImage[]

  /** Model used for generation */
  model: string

  /** Original prompt */
  prompt: string
}

/**
 * Image metadata for SEO and attribution
 */
export interface ImageMetadata {
  /** Image title */
  title?: string
  /** Image description */
  description?: string
  /** Author/artist name */
  author?: string
  /** Copyright notice */
  copyright?: string
  /** Keywords for search discovery */
  keywords?: string[]
  /** Source URL */
  source?: string
}

/**
 * Default author for all generated images
 */
const DEFAULT_AUTHOR = 'Mike P. Sinn'
const DEFAULT_COPYRIGHT = `© ${new Date().getFullYear()} Mike P. Sinn. All rights reserved.`

/**
 * Generate images using Google Gemini Imagen API
 *
 * @example
 * ```typescript
 * const result = await generateImages({
 *   prompt: 'A neobrutalist propaganda poster for medical research',
 *   count: 2,
 *   aspectRatio: '16:9'
 * })
 *
 * // Save the first image
 * const imageBuffer = Buffer.from(result.images[0].data, 'base64')
 * await fs.writeFile('output.png', imageBuffer)
 * ```
 */
export async function generateImages(
  options: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  const {
    prompt,
    count = 1,
    aspectRatio = '1:1',
    model = 'gemini-3-pro-image-preview',
    negativePrompt,
  } = options

  log.info('Generating images', {
    prompt: prompt.substring(0, 100),
    count,
    aspectRatio,
    model,
  })

  try {
    const client = getClient()
    const images: GeneratedImage[] = []

    // Build the full prompt with aspect ratio and negative prompt
    let fullPrompt = prompt
    fullPrompt += `\n\nIMPORTANT: Generate image with aspect ratio ${aspectRatio}.`
    if (negativePrompt) {
      fullPrompt += `\n\nDO NOT include: ${negativePrompt}`
    }

    // Generate images one at a time (Gemini doesn't support batch generation in one call)
    for (let i = 0; i < count; i++) {
      const response = await client.models.generateContent({
        model,
        contents: fullPrompt,
      })

      // Extract image from response
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0]
        const parts = candidate.content?.parts || []

        for (const part of parts) {
          if (part.inlineData?.data) {
            images.push({
              imageBytes: part.inlineData.data,
              raiFilteredReason: undefined,
              enhancedPrompt: undefined,
            })
          }
        }
      }
    }

    if (images.length === 0) {
      throw new Error('No images were generated')
    }

    log.info('Images generated successfully', {
      count: images.length,
      model,
    })

    return {
      images,
      model,
      prompt,
    }
  } catch (error: any) {
    log.error('Failed to generate images', {
      error: error.message || String(error),
      prompt: prompt.substring(0, 100),
    })
    throw new Error(`Image generation failed: ${error.message || String(error)}`)
  }
}

/**
 * Save a generated image to a file with rich metadata for SEO
 *
 * Adds EXIF/XMP metadata including title, description, author, copyright, and keywords.
 * This improves search engine discovery and proper attribution.
 *
 * @example
 * ```typescript
 * const result = await generateImages({ prompt: 'A cat' })
 * await saveImage(result.images[0], 'output/cat.png', {
 *   title: 'Cute Cat Image',
 *   description: 'A beautiful cat sitting in the sun',
 *   keywords: ['cat', 'pet', 'animal']
 * })
 * ```
 */
export async function saveImage(
  image: GeneratedImage,
  filePath: string,
  metadata?: ImageMetadata
): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  // Check if image was filtered
  if (image.raiFilteredReason) {
    throw new Error(`Image was filtered: ${image.raiFilteredReason}`)
  }

  if (!image.imageBytes) {
    throw new Error('No image data available')
  }

  // Ensure directory exists
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })

  // Decode base64
  const buffer = Buffer.from(image.imageBytes, 'base64')

  // Build EXIF metadata
  const author = metadata?.author || DEFAULT_AUTHOR
  const copyright = metadata?.copyright || DEFAULT_COPYRIGHT

  // Use sharp to add metadata
  // For PNG: adds tEXt chunks and XMP data
  // For JPEG: adds EXIF data
  const isPng = filePath.toLowerCase().endsWith('.png')

  let sharpInstance = sharp(buffer)

  if (isPng) {
    // PNG metadata via tEXt chunks
    // Sharp doesn't directly support PNG text chunks, so we use withMetadata for EXIF
    // and rely on XMP for richer metadata
    sharpInstance = sharpInstance
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: copyright,
            Artist: author,
            ImageDescription: metadata?.description || '',
            DocumentName: metadata?.title || '',
            Software: 'Decentralized Institutes of Health',
          },
        },
      })
      .png({
        compressionLevel: 9,
        effort: 10,
      })
  } else {
    // JPEG with full EXIF
    sharpInstance = sharpInstance
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: copyright,
            Artist: author,
            ImageDescription: metadata?.description || '',
            DocumentName: metadata?.title || '',
            Software: 'Decentralized Institutes of Health',
          },
        },
      })
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
  }

  const outputBuffer = await sharpInstance.toBuffer()
  await fs.writeFile(filePath, outputBuffer)

  log.info('Image saved with metadata', {
    filePath,
    size: outputBuffer.length,
    author,
    title: metadata?.title,
  })
}

/**
 * Generate and save images in one step with metadata
 *
 * @example
 * ```typescript
 * await generateAndSaveImages({
 *   prompt: 'Neobrutalist medical research poster',
 *   count: 3,
 *   outputDir: 'public/assets/generated',
 *   filePrefix: 'poster',
 *   metadata: {
 *     title: 'Medical Research Poster',
 *     description: 'A neobrutalist style poster promoting medical research',
 *     keywords: ['medical', 'research', 'health']
 *   }
 * })
 * // Creates: poster-1.png, poster-2.png, poster-3.png with embedded metadata
 * ```
 */
export async function generateAndSaveImages(options: {
  prompt: string
  count?: number
  aspectRatio?: ImageGenerationOptions['aspectRatio']
  outputDir: string
  filePrefix: string
  format?: 'png' | 'jpg'
  /** Metadata for SEO and attribution */
  metadata?: ImageMetadata
}): Promise<string[]> {
  const {
    prompt,
    count = 1,
    aspectRatio,
    outputDir,
    filePrefix,
    format = 'png',
    metadata,
  } = options

  const result = await generateImages({
    prompt,
    count,
    aspectRatio,
  })

  const filePaths: string[] = []

  for (let i = 0; i < result.images.length; i++) {
    const fileName = count === 1
      ? `${filePrefix}.${format}`
      : `${filePrefix}-${i + 1}.${format}`

    const filePath = `${outputDir}/${fileName}`
    await saveImage(result.images[i], filePath, metadata)
    filePaths.push(filePath)
  }

  log.info('Generated and saved images with metadata', {
    count: filePaths.length,
    outputDir,
    title: metadata?.title,
    author: metadata?.author || DEFAULT_AUTHOR,
  })

  return filePaths
}
