import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env.js';
import { buildSystemPrompt } from './system-prompt.js';
import { toolDefinitions, executeTool, type ToolName } from './tools.js';
import type { BrandKit, Customer, MaterialType, SSEEvent } from '@hyble/shared';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface AgentRunParams {
  userMessage: string;
  customer: Customer;
  brandKit: BrandKit;
  materialType: MaterialType;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  referenceImageKey?: string;
  onEvent: (event: SSEEvent) => void;
}

export interface AgentRunResult {
  agentResponse: string;
  imageKey: string;
  costCents: number;
  metadata: Record<string, unknown>;
  promptConstructed: string;
}

export async function runAgent(params: AgentRunParams): Promise<AgentRunResult> {
  const { userMessage, customer, brandKit, materialType, conversationHistory, referenceImageKey, onEvent } = params;

  const systemPrompt = buildSystemPrompt({
    customerName: customer.name,
    primaryState: customer.primary_state,
    materialType,
    brandKit,
  });

  // Build the messages for Claude
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user',
      content: referenceImageKey
        ? `${userMessage}\n\n[Reference image attached: ${referenceImageKey}]`
        : userMessage,
    },
  ];

  onEvent({ event: 'building_prompt' });

  let imageKey = '';
  let costCents = 0;
  let metadata: Record<string, unknown> = {};
  let promptConstructed = '';
  let agentResponse = '';

  // Agentic tool-use loop
  let currentMessages = messages;

  while (true) {
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: toolDefinitions,
      messages: currentMessages,
    });

    // Collect text from this response
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
    if (textBlocks.length > 0) {
      agentResponse = textBlocks.map((b) => b.text).join('\n');
    }

    if (response.stop_reason === 'end_turn') {
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      // Add assistant turn
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
      ];

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const toolName = toolUse.name as ToolName;

        if (toolName === 'generate_pos_image') {
          onEvent({ event: 'generating' });
          promptConstructed = (toolUse.input as { prompt: string }).prompt;
        }

        if (toolName === 'extract_metadata') {
          onEvent({ event: 'extracting_metadata' });
        }

        const result = await executeTool(
          toolName,
          toolUse.input as Record<string, unknown>,
          materialType,
        );

        if (result.error) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            is_error: true,
            content: result.error,
          });
          continue;
        }

        if (result.image_key) {
          imageKey = result.image_key;
          costCents += result.cost_cents ?? 0;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ image_key: result.image_key, cost_cents: result.cost_cents }),
          });
        } else if (result.metadata) {
          metadata = result.metadata as unknown as Record<string, unknown>;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.metadata),
          });
        }
      }

      // Feed tool results back
      currentMessages = [
        ...currentMessages,
        { role: 'user', content: toolResults },
      ];
    } else {
      // Unexpected stop reason
      break;
    }
  }

  return { agentResponse, imageKey, costCents, metadata, promptConstructed };
}
