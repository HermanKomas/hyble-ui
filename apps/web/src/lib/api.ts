// Typed API client. All requests go through /api (proxied in dev, same-origin in prod).

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser { id: string; email: string; created_at: string }

export const auth = {
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
};

// ── Customers ────────────────────────────────────────────────────────────────

export interface ApiCustomer {
  customer: { id: string; name: string; primary_state: string; brand_kit_id: string; created_at: string };
  brand_kit: { id: string; supplier_name: string; primary_color_hex: string; secondary_color_hex: string; font_family: string; logo_url: string | null; mandatory_disclaimers: string[] };
}

export const customers = {
  list: () => request<{ customers: ApiCustomer[] }>('/orders/customers'),
};

// ── Orders ───────────────────────────────────────────────────────────────────

export interface ApiOrder {
  order: {
    id: string; user_id: string; customer_id: string;
    material_type: string; status: string;
    final_generation_id: string | null;
    created_at: string; updated_at: string;
  };
  customer: ApiCustomer['customer'];
  brand_kit: ApiCustomer['brand_kit'];
  thumbnail_url?: string | null;
  generations?: ApiGeneration[];
  messages?: ApiMessage[];
}

export interface ApiGeneration {
  id: string; order_id: string; output_image_url: string; output_image_key: string;
  agent_response: string; prompt_user_input: string; cost_cents: number;
  metadata: Record<string, unknown>; created_at: string;
}

export interface ApiMessage {
  id: string; order_id: string; role: 'user' | 'assistant';
  content: string; generation_id: string | null; created_at: string;
}

export const orders = {
  list: () => request<{ orders: ApiOrder[] }>('/orders'),
  get: (id: string) => request<ApiOrder>(`/orders/${id}`),
  finalise: (id: string, final_generation_id: string) =>
    request<{ order: ApiOrder['order'] }>(`/orders/${id}/finalise`, {
      method: 'PATCH',
      body: JSON.stringify({ final_generation_id }),
    }),
};

// ── Image upload ─────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/images/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json() as Promise<{ key: string; url: string }>;
}
