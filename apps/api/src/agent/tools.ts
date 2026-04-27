import type Anthropic from '@anthropic-ai/sdk';
import type { GenerationMetadata } from '@hyble/shared';
import { generateImage, editImage } from '../services/image-gen.js';
import { downloadToBuffer } from '../services/storage.js';
import { env } from '../env.js';

export type ToolName = 'generate_pos_image' | 'extract_metadata';

export interface GeneratePosImageInput {
  prompt: string;
  reference_image_key?: string;
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'low' | 'medium' | 'high';
}

export interface ExtractMetadataInput {
  design_description: string;
  supplier_name: string;
}

export interface ToolResult {
  image_key?: string;
  cost_cents?: number;
  metadata?: GenerationMetadata;
  error?: string;
}

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'generate_pos_image',
    description:
      'Generate a POS material image using gpt-image-2. Use this to create new designs or edit existing ones. For new menus pass only prompt. For recreation/edits, pass reference_image_key.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed, print-optimised image generation prompt.',
        },
        reference_image_key: {
          type: 'string',
          description: 'S3 key of the reference image to edit (for recreate flow).',
        },
        size: {
          type: 'string',
          enum: ['1024x1024', '1024x1536', '1536x1024'],
          description: 'Image dimensions. Default 1024x1536 for portrait materials.',
        },
        quality: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Generation quality. Use high for first/final renders, medium for iterations.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'extract_metadata',
    description:
      'Extract structured metadata from a generated design for the chargeback pipeline.',
    input_schema: {
      type: 'object' as const,
      properties: {
        design_description: {
          type: 'string',
          description: 'Your description of what the generated design contains.',
        },
        supplier_name: {
          type: 'string',
          description: 'The primary supplier brand on this piece.',
        },
      },
      required: ['design_description', 'supplier_name'],
    },
  },
];

export async function executeTool(
  name: ToolName,
  input: Record<string, unknown>,
  materialType: string,
): Promise<ToolResult> {
  if (name === 'generate_pos_image') {
    const typed = input as unknown as GeneratePosImageInput;
    try {
      if (typed.reference_image_key) {
        const refBuffer = await downloadToBuffer(typed.reference_image_key);
        const result = await editImage({
          prompt: typed.prompt,
          referenceImageBuffer: refBuffer,
          size: typed.size,
          quality: typed.quality,
        });
        return result;
      } else {
        const result = await generateImage({
          prompt: typed.prompt,
          size: typed.size,
          quality: typed.quality,
        });
        return result;
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (name === 'extract_metadata') {
    const typed = input as unknown as ExtractMetadataInput;
    // Derive metadata from description — simple heuristics for MVP
    const isLarge = ['menu', 'promotional_poster'].includes(materialType);
    const metadata: GenerationMetadata = {
      brand_mentions: [{ brand: typed.supplier_name, supplier: typed.supplier_name, count: 1 }],
      format: isLarge ? 'large' : 'small',
      dimensions: isLarge ? { width_in: 8.5, height_in: 11 } : { width_in: 4, height_in: 6 },
      designation_code: 'NCB/b',
      supplier: typed.supplier_name,
    };
    return { metadata };
  }

  return { error: `Unknown tool: ${name}` };
}
