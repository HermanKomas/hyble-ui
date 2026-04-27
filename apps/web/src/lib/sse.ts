import type { SSEEvent } from '@hyble/shared';

export interface GenerateParams {
  order_id?: string;
  customer_id: string;
  material_type: string;
  message: string;
  reference_image_key?: string;
}

export interface SSECallbacks {
  onEvent: (event: SSEEvent) => void;
  onError: (message: string) => void;
  onDone: (event: Extract<SSEEvent, { event: 'done' }>) => void;
}

/** POST to /api/generate and read the SSE stream via fetch */
export async function streamGenerate(
  params: GenerateParams,
  callbacks: SSECallbacks,
): Promise<void> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    callbacks.onError((body as { error?: string }).error ?? 'Generation failed');
    return;
  }

  if (!res.body) {
    callbacks.onError('No response body');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw) as SSEEvent;
        callbacks.onEvent(event);

        if (event.event === 'done') {
          callbacks.onDone(event);
          return;
        }
        if (event.event === 'error') {
          callbacks.onError(event.message);
          return;
        }
      } catch {
        // malformed SSE line, skip
      }
    }
  }
}
