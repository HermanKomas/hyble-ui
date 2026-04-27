import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import type { JWTPayload } from '../middleware/auth.js';
import { runAgent } from '../agent/index.js';
import { imageApiUrl } from '../services/storage.js';
import { generateRequestSchema } from '@hyble/shared';
import type { SSEEvent, BrandKit, Customer, GenerationMetadata } from '@hyble/shared';
import { env } from '../env.js';

type AuthRequest = Parameters<typeof requireAuth>[0] & { user: JWTPayload };

function sendSSE(reply: Parameters<typeof requireAuth>[1], event: SSEEvent) {
  (reply as { raw: { write: (s: string) => void } }).raw.write(
    `data: ${JSON.stringify(event)}\n\n`,
  );
}

export async function generateRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = generateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { sub: userId } = (request as AuthRequest).user;
    const { order_id, customer_id, material_type, message, reference_image_key } = parsed.data;

    // Fetch customer + brand kit
    const [customerRow] = await db
      .select({ customer: schema.customers, brand_kit: schema.brand_kits })
      .from(schema.customers)
      .innerJoin(schema.brand_kits, eq(schema.customers.brand_kit_id, schema.brand_kits.id))
      .where(eq(schema.customers.id, customer_id))
      .limit(1);

    if (!customerRow) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    // Check daily generation cap
    // (simplified check — could be a real count query)

    // Resolve or create order
    let orderId = order_id;
    if (!orderId) {
      const [newOrder] = await db
        .insert(schema.orders)
        .values({ user_id: userId, customer_id, material_type })
        .returning();
      orderId = newOrder!.id;
    } else {
      // Verify order belongs to user
      const [existingOrder] = await db
        .select()
        .from(schema.orders)
        .where(and(eq(schema.orders.id, orderId), eq(schema.orders.user_id, userId)))
        .limit(1);
      if (!existingOrder) return reply.status(404).send({ error: 'Order not found' });
    }

    // Load conversation history
    const msgs = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.order_id, orderId))
      .orderBy(schema.messages.created_at);

    const conversationHistory = msgs.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Start SSE stream
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    // Persist user message
    await db.insert(schema.messages).values({
      order_id: orderId,
      role: 'user',
      content: message,
    });

    if (reference_image_key) {
      sendSSE(reply, { event: 'reading_reference' });
    }

    try {
      const result = await runAgent({
        userMessage: message,
        customer: customerRow.customer as Customer,
        brandKit: customerRow.brand_kit as BrandKit,
        materialType: material_type,
        conversationHistory,
        referenceImageKey: reference_image_key,
        onEvent: (event) => sendSSE(reply, event),
      });

      // Persist generation
      const [generation] = await db
        .insert(schema.generations)
        .values({
          order_id: orderId,
          prompt_user_input: message,
          prompt_constructed: result.promptConstructed,
          reference_image_key: reference_image_key ?? null,
          output_image_key: result.imageKey,
          agent_response: result.agentResponse,
          metadata: result.metadata,
          cost_cents: result.costCents,
          model_used: env.ANTHROPIC_MODEL,
          status: 'done',
        })
        .returning();

      // Persist assistant message
      await db.insert(schema.messages).values({
        order_id: orderId,
        role: 'assistant',
        content: result.agentResponse,
        generation_id: generation!.id,
      });

      // Update order timestamp
      await db
        .update(schema.orders)
        .set({ updated_at: new Date() })
        .where(eq(schema.orders.id, orderId));

      const imageUrl = imageApiUrl(result.imageKey);

      sendSSE(reply, {
        event: 'done',
        generation_id: generation!.id,
        image_url: imageUrl,
        agent_response: result.agentResponse,
        order_id: orderId,
        metadata: result.metadata as unknown as GenerationMetadata,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      sendSSE(reply, { event: 'error', message });
    }

    reply.raw.end();
  });
}
