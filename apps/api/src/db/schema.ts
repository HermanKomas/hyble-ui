import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────────────────────

export const materialTypeEnum = pgEnum('material_type', [
  'menu',
  'tent_card',
  'bar_top_card',
  'shelf_talker',
  'promotional_poster',
]);

export const orderStatusEnum = pgEnum('order_status', ['draft', 'finalised']);

export const generationStatusEnum = pgEnum('generation_status', [
  'pending',
  'generating',
  'done',
  'error',
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const brand_kits = pgTable('brand_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplier_name: text('supplier_name').notNull(),
  primary_color_hex: text('primary_color_hex').notNull(),
  secondary_color_hex: text('secondary_color_hex').notNull(),
  font_family: text('font_family').notNull().default('Instrument Serif'),
  logo_url: text('logo_url'),
  mandatory_disclaimers: jsonb('mandatory_disclaimers').notNull().$type<string[]>().default([]),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  primary_state: text('primary_state').notNull(),
  brand_kit_id: uuid('brand_kit_id').notNull().references(() => brand_kits.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  customer_id: uuid('customer_id').notNull().references(() => customers.id),
  material_type: materialTypeEnum('material_type').notNull(),
  status: orderStatusEnum('status').notNull().default('draft'),
  final_generation_id: uuid('final_generation_id'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const generations = pgTable('generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id),
  parent_generation_id: uuid('parent_generation_id'),
  prompt_user_input: text('prompt_user_input').notNull(),
  prompt_constructed: text('prompt_constructed').notNull(),
  reference_image_key: text('reference_image_key'),
  output_image_key: text('output_image_key').notNull(),
  agent_response: text('agent_response').notNull(),
  metadata: jsonb('metadata').notNull().$type<Record<string, unknown>>().default({}),
  cost_cents: integer('cost_cents').notNull().default(0),
  model_used: text('model_used').notNull(),
  status: generationStatusEnum('status').notNull().default('done'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id),
  role: text('role').notNull().$type<'user' | 'assistant'>(),
  content: text('content').notNull(),
  generation_id: uuid('generation_id'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// ── Relations ────────────────────────────────────────────────────────────────

export const customersRelations = relations(customers, ({ one }) => ({
  brand_kit: one(brand_kits, {
    fields: [customers.brand_kit_id],
    references: [brand_kits.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.user_id], references: [users.id] }),
  customer: one(customers, { fields: [orders.customer_id], references: [customers.id] }),
  generations: many(generations),
  messages: many(messages),
}));

export const generationsRelations = relations(generations, ({ one }) => ({
  order: one(orders, { fields: [generations.order_id], references: [orders.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, { fields: [messages.order_id], references: [orders.id] }),
}));
