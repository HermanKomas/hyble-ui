import { useState, useCallback, useEffect, useRef } from 'react';
import { PromptSentence, type PromptValues, type CustomerOption } from '../components/create/PromptSentence.js';
import { ChatPanel, type ChatMessage, SSE_STEPS } from '../components/create/ChatPanel.js';
import { MenuPreviewSurface } from '../components/create/MenuPreview.js';
import { customers as customersApi, uploadImage } from '../lib/api.js';
import { streamGenerate } from '../lib/sse.js';
import type { SSEEvent } from '@hyble/shared';

function toCustomerOption(row: { customer: { id: string; name: string; primary_state: string; brand_kit_id: string; created_at: string }; brand_kit: { supplier_name: string; primary_color_hex: string } }): CustomerOption {
  return {
    id: row.customer.id,
    name: row.customer.name,
    primary_state: row.customer.primary_state,
    supplier_name: row.brand_kit.supplier_name,
    primary_color_hex: row.brand_kit.primary_color_hex,
  };
}

const EMPTY_VALUES: PromptValues = {
  materialType: null,
  customer: null,
  image: null,
  notes: '',
};

export function CreatePage() {
  const [phase, setPhase] = useState<'initial' | 'active'>('initial');
  const [values, setValues] = useState<PromptValues>(EMPTY_VALUES);
  const [initialValues, setInitialValues] = useState<PromptValues>(EMPTY_VALUES);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(SSE_STEPS[0]?.id ?? 'building_prompt');
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);
  const [reveal, setReveal] = useState(0);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const revealRef = useRef<number>(0);
  const revealAnim = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Load customers
  useEffect(() => {
    customersApi.list()
      .then(({ customers }) => setCustomerOptions(customers.map(toCustomerOption)))
      .catch(console.error);
  }, []);

  const animateReveal = useCallback((targetReveal: number, durationMs: number) => {
    const start = Date.now();
    const startReveal = revealRef.current;
    if (revealAnim.current) cancelAnimationFrame(revealAnim.current);

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startReveal + (targetReveal - startReveal) * eased;
      revealRef.current = next;
      setReveal(next);
      if (t < 1) revealAnim.current = requestAnimationFrame(tick);
    };
    revealAnim.current = requestAnimationFrame(tick);
  }, []);

  const runGeneration = useCallback(async (message: string, refKey?: string, existingOrderId?: string) => {
    if (!values.customer || !values.materialType) return;

    setGenerating(true);
    setReveal(0);
    revealRef.current = 0;
    setCurrentStepId(SSE_STEPS[0]?.id ?? 'building_prompt');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    await streamGenerate(
      {
        order_id: existingOrderId,
        customer_id: values.customer.id,
        material_type: values.materialType,
        message,
        reference_image_key: refKey ?? values.image?.key,
      },
      {
        onEvent: (event: SSEEvent) => {
          if (event.event === 'building_prompt') {
            setCurrentStepId('building_prompt');
          } else if (event.event === 'generating') {
            setCurrentStepId('generating');
            animateReveal(0.9, 2200);
          } else if (event.event === 'extracting_metadata') {
            setCurrentStepId('extracting_metadata');
          } else if (event.event === 'reading_reference') {
            setCurrentStepId('reading_reference');
          }
        },
        onDone: (event) => {
          setOrderId(event.order_id);
          setCurrentGenerationId(event.generation_id);
          setCurrentImageUrl(event.image_url);
          animateReveal(1, 400);

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: event.agent_response,
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            generationId: event.generation_id,
            imageUrl: event.image_url,
            materialType: values.materialType ?? undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setGenerating(false);
        },
        onError: (message) => {
          const errMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Something went wrong: ${message}`,
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errMsg]);
          setGenerating(false);
          animateReveal(0, 200);
        },
      },
    );
  }, [values, animateReveal]);

  const handleInitialGenerate = useCallback(() => {
    if (!values.customer || !values.materialType) return;
    const message = `Create a ${values.materialType} for ${values.customer.name}${values.notes ? `. Notes: ${values.notes}` : ''}`;
    setInitialValues({ ...values });
    setPhase('active');
    runGeneration(message);
  }, [values, runGeneration]);

  const handleFollowUp = useCallback((text: string) => {
    runGeneration(text, undefined, orderId);
  }, [orderId, runGeneration]);

  const handleSelectGeneration = useCallback((genId: string) => {
    const msg = messages.find((m) => m.generationId === genId);
    if (msg?.imageUrl) {
      setCurrentGenerationId(genId);
      setCurrentImageUrl(msg.imageUrl);
      setReveal(1);
      revealRef.current = 1;
    }
  }, [messages]);

  const handleUploadImage = useCallback(async (file: File) => {
    return uploadImage(file);
  }, []);

  const handleSave = useCallback(() => {
    // Order is auto-created on generation; just notify user
    alert(`Order saved. ID: ${orderId ?? 'pending'}`);
  }, [orderId]);

  const handleDownload = useCallback(() => {
    if (currentImageUrl) window.open(currentImageUrl, '_blank');
  }, [currentImageUrl]);

  const handleRegen = useCallback(() => {
    if (!values.customer || !values.materialType) return;
    runGeneration('Please regenerate with the same brief.', undefined, orderId);
  }, [values, orderId, runGeneration]);

  // ── Mobile detection ──────────────────────────────────────────────────────
  const isMobile = window.innerWidth < 768;

  // ── Initial state ────────────────────────────────────────────────────────
  if (phase === 'initial') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--paper)' }}>
        <PromptSentence
          values={values}
          setValues={setValues}
          customers={customerOptions}
          onGenerate={handleInitialGenerate}
          busy={generating}
          onUploadImage={handleUploadImage}
        />
      </div>
    );
  }

  // ── Active state — split layout ───────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MenuPreviewSurface
          customer={initialValues.customer}
          materialType={initialValues.materialType}
          status={generating ? 'generating' : currentImageUrl ? 'done' : 'empty'}
          reveal={reveal}
          imageUrl={currentImageUrl}
          hasFinal={!!currentImageUrl && !generating}
          onRegen={handleRegen}
          onSave={handleSave}
          onDownload={handleDownload}
        />
        <div style={{ flex: 1, overflow: 'hidden', borderTop: '1px solid var(--rule)' }}>
          <ChatPanel
            initialValues={initialValues}
            messages={messages}
            generating={generating}
            currentStepId={currentStepId}
            currentGenerationId={currentGenerationId}
            onSelectGeneration={handleSelectGeneration}
            onSend={handleFollowUp}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left — chat */}
      <div style={{ width: 420, flexShrink: 0, borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatPanel
          initialValues={initialValues}
          messages={messages}
          generating={generating}
          currentStepId={currentStepId}
          currentGenerationId={currentGenerationId}
          onSelectGeneration={handleSelectGeneration}
          onSend={handleFollowUp}
        />
      </div>

      {/* Right — design preview */}
      <MenuPreviewSurface
        customer={initialValues.customer}
        materialType={initialValues.materialType}
        status={generating ? 'generating' : currentImageUrl ? 'done' : 'empty'}
        reveal={reveal}
        imageUrl={currentImageUrl}
        hasFinal={!!currentImageUrl && !generating}
        onRegen={handleRegen}
        onSave={handleSave}
        onDownload={handleDownload}
      />
    </div>
  );
}
