import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PromptSentence, type PromptValues, type CustomerOption } from '../components/create/PromptSentence.js';
import { ChatPanel, type ChatMessage, SSE_STEPS } from '../components/create/ChatPanel.js';
import { MenuPreviewSurface } from '../components/create/MenuPreview.js';
import { customers as customersApi, orders as ordersApi, uploadImage, type ApiOrder } from '../lib/api.js';
import { streamGenerate } from '../lib/sse.js';
import type { SSEEvent, MaterialType } from '@hyble/shared';
import { MATERIAL_TYPE_LABELS } from '@hyble/shared';


function toCustomerOption(row: { customer: { id: string; name: string; primary_state: string; brand_kit_id: string; created_at: string }; brand_kit: { supplier_name: string; primary_color_hex: string } }): CustomerOption {
  return {
    id: row.customer.id,
    name: row.customer.name,
    primary_state: row.customer.primary_state,
    supplier_name: row.brand_kit.supplier_name,
    primary_color_hex: row.brand_kit.primary_color_hex,
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const EMPTY_VALUES: PromptValues = {
  materialType: null,
  customer: null,
  image: null,
  notes: '',
  size: null,
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
  const [orderHistory, setOrderHistory] = useState<ApiOrder[]>([]);
  const [resuming, setResuming] = useState(false);
  const revealRef = useRef<number>(0);
  const revealAnim = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const { orderId: urlOrderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  // Keep refs current for use inside effects without adding to dep arrays
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  // Load customers + order history
  useEffect(() => {
    customersApi.list()
      .then(({ customers }) => setCustomerOptions(customers.map(toCustomerOption)))
      .catch(console.error);
    ordersApi.list()
      .then(({ orders }) => setOrderHistory(orders.filter((o) => o.thumbnail_url)))
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
          navigate(`/create/${event.order_id}`, { replace: true });
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
  }, [values, animateReveal, navigate]);

  const handleInitialGenerate = useCallback(() => {
    if (!values.customer || !values.materialType) return;
    const typeLabel = MATERIAL_TYPE_LABELS[values.materialType];
    const sizeStr = values.size ? ` (${values.size})` : '';
    const message = `Create a ${typeLabel}${sizeStr} for ${values.customer.name}${values.notes ? `. Notes: ${values.notes}` : ''}`;
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

  const handleDeleteOrder = useCallback(async (e: React.MouseEvent, deleteOrderId: string) => {
    e.stopPropagation();
    setOrderHistory((prev) => prev.filter((o) => o.order.id !== deleteOrderId));
    ordersApi.delete(deleteOrderId).catch(console.error);
  }, []);

  const handleResumeOrder = useCallback(async (resumeOrderId: string) => {
    setResuming(true);
    try {
      const orderData = await ordersApi.get(resumeOrderId);

      const customerOption: CustomerOption = {
        id: orderData.customer.id,
        name: orderData.customer.name,
        primary_state: orderData.customer.primary_state,
        supplier_name: orderData.brand_kit.supplier_name,
        primary_color_hex: orderData.brand_kit.primary_color_hex,
      };

      const resumedValues: PromptValues = {
        materialType: orderData.order.material_type as MaterialType,
        customer: customerOption,
        image: null,
        notes: '',
        size: null,
      };

      setValues(resumedValues);
      setInitialValues(resumedValues);
      setOrderId(orderData.order.id);

      // Reconstruct chat messages from stored messages + generations
      const genMap = new Map((orderData.generations ?? []).map((g) => [g.id, g]));
      const chatMessages: ChatMessage[] = (orderData.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        generationId: m.generation_id ?? undefined,
        imageUrl: m.generation_id ? genMap.get(m.generation_id)?.output_image_url : undefined,
        materialType: resumedValues.materialType ?? undefined,
      }));
      setMessages(chatMessages);

      // Show the latest generation in the preview panel
      const gens = orderData.generations ?? [];
      const latestGen = gens[gens.length - 1];
      if (latestGen) {
        setCurrentImageUrl(latestGen.output_image_url);
        setCurrentGenerationId(latestGen.id);
        setReveal(1);
        revealRef.current = 1;
      }

      setPhase('active');
    } catch (err) {
      console.error('Failed to resume order', err);
    } finally {
      setResuming(false);
    }
  }, []);

  // URL-driven: auto-resume when orderId appears in URL, reset when it disappears
  useEffect(() => {
    if (!urlOrderId) {
      // e.g. user clicked "Create" in the rail while in the workspace
      if (phaseRef.current === 'active') {
        setPhase('initial');
        setValues(EMPTY_VALUES);
        setInitialValues(EMPTY_VALUES);
        setMessages([]);
        setGenerating(false);
        setCurrentImageUrl(undefined);
        setOrderId(undefined);
        setReveal(0);
        revealRef.current = 0;
      }
      return;
    }
    // Skip if this order is already loaded (e.g. URL updated after generation completed)
    if (orderIdRef.current === urlOrderId) return;
    handleResumeOrder(urlOrderId);
  }, [urlOrderId, handleResumeOrder]);

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
          busy={generating || resuming}
          onUploadImage={handleUploadImage}
        />

        {orderHistory.length > 0 && (
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '0 24px 56px' }}>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32, marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="eyebrow">Recent designs</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{orderHistory.length} project{orderHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14 }}>
              {orderHistory.map((o) => (
                <button
                  key={o.order.id}
                  onClick={() => navigate(`/create/${o.order.id}`)}
                  disabled={resuming}
                  style={{
                    display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0,
                    border: '1px solid var(--rule)', borderRadius: 'var(--r-2)',
                    background: 'var(--paper)', overflow: 'hidden', position: 'relative',
                    cursor: 'pointer', transition: 'box-shadow 140ms, border-color 140ms',
                    opacity: resuming ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink-3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)'; }}
                >
                  <button
                    onClick={(e) => handleDeleteOrder(e, o.order.id)}
                    title="Delete"
                    style={{
                      position: 'absolute', top: 6, right: 6, zIndex: 2,
                      width: 20, height: 20, borderRadius: 999, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer',
                      color: '#fff', fontSize: 13, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                  <div style={{ aspectRatio: '8.5 / 11', background: 'var(--paper-2)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    {o.thumbnail_url ? (
                      <img src={o.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div style={{ padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {o.customer.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {MATERIAL_TYPE_LABELS[o.order.material_type as MaterialType]}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>
                      {timeAgo(o.order.updated_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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
