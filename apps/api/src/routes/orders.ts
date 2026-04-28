import type { FastifyInstance } from 'fastify';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import type { JWTPayload } from '../middleware/auth.js';
import { imageApiUrl } from '../services/storage.js';

type AuthRequest = Parameters<typeof requireAuth>[0] & { user: JWTPayload };

export async function orderRoutes(app: FastifyInstance) {
  // List all orders for the current user
  app.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { sub: userId } = (request as AuthRequest).user;

    const rows = await db
      .select({
        order: schema.orders,
        customer: schema.customers,
        brand_kit: schema.brand_kits,
      })
      .from(schema.orders)
      .innerJoin(schema.customers, eq(schema.orders.customer_id, schema.customers.id))
      .innerJoin(schema.brand_kits, eq(schema.customers.brand_kit_id, schema.brand_kits.id))
      .where(eq(schema.orders.user_id, userId))
      .orderBy(desc(schema.orders.updated_at));

    // Fetch latest generation per order for thumbnails
    const thumbnailMap = new Map<string, string>();
    const orderIds = rows.map((r) => r.order.id);
    if (orderIds.length > 0) {
      const gens = await db
        .select({ order_id: schema.generations.order_id, output_image_key: schema.generations.output_image_key })
        .from(schema.generations)
        .where(inArray(schema.generations.order_id, orderIds))
        .orderBy(desc(schema.generations.created_at));
      for (const g of gens) {
        if (!thumbnailMap.has(g.order_id)) thumbnailMap.set(g.order_id, imageApiUrl(g.output_image_key));
      }
    }

    return reply.send({
      orders: rows.map((r) => ({ ...r, thumbnail_url: thumbnailMap.get(r.order.id) ?? null })),
    });
  });

  // Get single order with generations and messages
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub: userId } = (request as AuthRequest).user;
      const { id } = request.params;

      const [orderRow] = await db
        .select({
          order: schema.orders,
          customer: schema.customers,
          brand_kit: schema.brand_kits,
        })
        .from(schema.orders)
        .innerJoin(schema.customers, eq(schema.orders.customer_id, schema.customers.id))
        .innerJoin(schema.brand_kits, eq(schema.customers.brand_kit_id, schema.brand_kits.id))
        .where(and(eq(schema.orders.id, id), eq(schema.orders.user_id, userId)))
        .limit(1);

      if (!orderRow) return reply.status(404).send({ error: 'Order not found' });

      const gens = await db
        .select()
        .from(schema.generations)
        .where(eq(schema.generations.order_id, id))
        .orderBy(schema.generations.created_at);

      const msgs = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.order_id, id))
        .orderBy(schema.messages.created_at);

      // Add image URLs to generations
      const generationsWithUrls = gens.map((g) => ({
        ...g,
        output_image_url: imageApiUrl(g.output_image_key),
      }));

      return reply.send({ ...orderRow, generations: generationsWithUrls, messages: msgs });
    },
  );

  // Finalise an order
  app.patch<{ Params: { id: string }; Body: { final_generation_id: string } }>(
    '/:id/finalise',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub: userId } = (request as AuthRequest).user;
      const { id } = request.params;
      const { final_generation_id } = request.body;

      const [updated] = await db
        .update(schema.orders)
        .set({ status: 'finalised', final_generation_id, updated_at: new Date() })
        .where(and(eq(schema.orders.id, id), eq(schema.orders.user_id, userId)))
        .returning();

      if (!updated) return reply.status(404).send({ error: 'Order not found' });
      return reply.send({ order: updated });
    },
  );

  // List all customers (for the prompt builder dropdown)
  app.get('/customers', { preHandler: [requireAuth] }, async (_request, reply) => {
    const rows = await db
      .select({
        customer: schema.customers,
        brand_kit: schema.brand_kits,
      })
      .from(schema.customers)
      .innerJoin(schema.brand_kits, eq(schema.customers.brand_kit_id, schema.brand_kits.id))
      .orderBy(schema.customers.name);

    return reply.send({ customers: rows });
  });
}
