import { z } from 'zod';
export const materialTypeSchema = z.enum([
    'menu',
    'tent_card',
    'bar_top_card',
    'shelf_talker',
    'promotional_poster',
]);
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const generateRequestSchema = z.object({
    order_id: z.string().uuid().optional(),
    customer_id: z.string().uuid(),
    material_type: materialTypeSchema,
    message: z.string().min(1).max(2000),
    reference_image_key: z.string().optional(),
});
export const orderCreateSchema = z.object({
    customer_id: z.string().uuid(),
    material_type: materialTypeSchema,
});
