export type MaterialType =
  | 'menu'
  | 'tent_card'
  | 'bar_top_card'
  | 'shelf_talker'
  | 'promotional_poster';

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  menu: 'Menu',
  tent_card: 'Tent Card',
  bar_top_card: 'Bar Top-Card',
  shelf_talker: 'Shelf Talker',
  promotional_poster: 'Promotional Poster',
};

export type OrderStatus = 'draft' | 'finalised';
export type GenerationStatus = 'pending' | 'generating' | 'done' | 'error';

export type SSEEvent =
  | { event: 'reading_reference' }
  | { event: 'building_prompt' }
  | { event: 'generating' }
  | { event: 'extracting_metadata' }
  | { event: 'done'; generation_id: string; image_url: string; agent_response: string; order_id: string; metadata: GenerationMetadata }
  | { event: 'error'; message: string };

export interface GenerationMetadata {
  brand_mentions: Array<{ brand: string; supplier: string; count: number }>;
  format: 'small' | 'large';
  dimensions: { width_in: number; height_in: number };
  designation_code: 'DNB' | 'NCB/b' | 'NCB/s' | 'none';
  supplier?: string;
}

export interface Customer {
  id: string;
  name: string;
  primary_state: string;
  brand_kit_id: string;
}

export interface BrandKit {
  id: string;
  supplier_name: string;
  primary_color_hex: string;
  secondary_color_hex: string;
  font_family: string;
  logo_url: string | null;
  mandatory_disclaimers: string[];
}

export interface Order {
  id: string;
  user_id: string;
  customer_id: string;
  material_type: MaterialType;
  status: OrderStatus;
  final_generation_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  brand_kit?: BrandKit;
}

export interface Generation {
  id: string;
  order_id: string;
  parent_generation_id: string | null;
  prompt_user_input: string;
  prompt_constructed: string;
  reference_image_key: string | null;
  output_image_key: string;
  output_image_url: string;
  agent_response: string;
  metadata: GenerationMetadata;
  cost_cents: number;
  model_used: string;
  status: GenerationStatus;
  created_at: string;
}

export interface Message {
  id: string;
  order_id: string;
  role: 'user' | 'assistant';
  content: string;
  generation_id: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
