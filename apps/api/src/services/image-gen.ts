import OpenAI, { toFile } from 'openai';
import { env } from '../env.js';
import { uploadBuffer } from './storage.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';
export type ImageQuality = 'low' | 'medium' | 'high';

interface GenerateOptions {
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
}

interface EditOptions {
  prompt: string;
  referenceImageBuffer: Buffer;
  referenceImageName?: string;
  size?: ImageSize;
  quality?: ImageQuality;
}

interface ImageResult {
  image_key: string;
  cost_cents: number;
}

/** Convert whatever gpt-image-2 returns (b64_json or url) to a Buffer */
async function imageResponseToBuffer(item: { b64_json?: string | null; url?: string | null } | undefined): Promise<Buffer> {
  if (!item) throw new Error('No image item in response');
  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`Failed to fetch image URL: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`Unexpected image response shape: ${JSON.stringify(item)}`);
}

/** Estimated cost in cents based on model/size/quality */
function estimateCost(quality: ImageQuality, size: ImageSize, isEdit = false): number {
  const base: Record<ImageQuality, number> = { low: 2, medium: 4, high: 8 };
  const sizeMult = size === '1024x1024' ? 1 : 1.5;
  const editMult = isEdit ? 1.8 : 1;
  return Math.round(base[quality] * sizeMult * editMult);
}

export async function generateImage(opts: GenerateOptions): Promise<ImageResult> {
  const size = opts.size ?? '1024x1536';
  const quality = opts.quality ?? 'high';

  const response = await openai.images.generate({
    model: env.OPENAI_IMAGE_MODEL,
    prompt: opts.prompt,
    n: 1,
    size,
    quality,
  });

  const buffer = await imageResponseToBuffer(response.data?.[0]);
  const image_key = await uploadBuffer(buffer, 'image/png', 'generated');

  return { image_key, cost_cents: estimateCost(quality, size) };
}

export async function editImage(opts: EditOptions): Promise<ImageResult> {
  const size = opts.size ?? '1024x1536';
  const quality = opts.quality ?? 'medium';

  const imageFile = await toFile(opts.referenceImageBuffer, opts.referenceImageName ?? 'reference.png', {
    type: 'image/png',
  });

  const response = await openai.images.edit({
    model: env.OPENAI_IMAGE_MODEL,
    image: imageFile,
    prompt: opts.prompt,
    n: 1,
    size,
    quality,
  });

  const buffer = await imageResponseToBuffer(response.data?.[0]);
  const image_key = await uploadBuffer(buffer, 'image/png', 'generated');

  return { image_key, cost_cents: estimateCost(quality, size, true) };
}
