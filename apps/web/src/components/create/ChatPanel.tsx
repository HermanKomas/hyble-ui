import { useEffect, useRef, useState } from 'react';
import { Ico } from '../shell/Icons.js';
import type { PromptValues, CustomerOption } from './PromptSentence.js';
import type { MaterialType } from '@hyble/shared';
import { MATERIAL_TYPE_LABELS } from '@hyble/shared';

export const SSE_STEPS = [
  { id: 'reading_reference', label: 'Reading reference' },
  { id: 'building_prompt', label: 'Composing the prompt' },
  { id: 'generating', label: 'Generating design' },
  { id: 'extracting_metadata', label: 'Extracting metadata' },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  generationId?: string;
  imageUrl?: string;
  materialType?: MaterialType;
}

// ── First message — the structured prompt rendered as a card ──────────────────

function PromptAsMessage({ values }: { values: PromptValues }) {
  const typeLabel = values.materialType ? MATERIAL_TYPE_LABELS[values.materialType] : '';
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 'var(--r-3)',
      background: 'var(--paper-2)', border: '1px solid var(--rule-soft)',
    }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        You · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, lineHeight: 1.4, color: 'var(--ink)' }}>
        Create a <span style={{ color: 'var(--accent)' }}>{typeLabel}</span> for{' '}
        <span style={{ color: 'var(--accent)' }}>{values.customer?.name}</span>
        {values.image && <> with <span style={{ color: 'var(--accent)' }}>{values.image.name}</span> as reference</>}
        {values.notes && <>. Notes: <span style={{ color: 'var(--ink-2)', fontStyle: 'italic' }}>"{values.notes}"</span></>}
      </div>
      {values.customer && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <span className="badge">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: values.customer.primary_color_hex }} />
            {values.customer.supplier_name}
          </span>
          <span className="badge">{values.customer.primary_state} rules</span>
        </div>
      )}
    </div>
  );
}

// ── Generating progress indicator ─────────────────────────────────────────────

function GeneratingMessage({ stepId }: { stepId: string }) {
  const stepIdx = SSE_STEPS.findIndex((s) => s.id === stepId);

  return (
    <div style={{ padding: '4px 4px 4px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Hyble · working
        <span className="status-pill live" style={{ textTransform: 'none', fontSize: 10.5, letterSpacing: '.04em', padding: '2px 8px' }}>
          {SSE_STEPS[stepIdx]?.label ?? 'Composing'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
        {SSE_STEPS.map((s, i) => {
          const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: state === 'pending' ? 'var(--ink-4)' : 'var(--ink-2)' }}>
              {state === 'done' ? <Ico.Check /> : state === 'active' ? <Ico.Spinner /> : (
                <span style={{ width: 14, height: 14, display: 'inline-block', border: '1px dashed var(--rule)', borderRadius: 999 }} />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Result message ────────────────────────────────────────────────────────────

function ResultMessage({ msg, isCurrent, onSelect }: {
  msg: ChatMessage;
  isCurrent: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="eyebrow">Hyble · {msg.time}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{msg.content}</div>
      {msg.generationId && (
        <button
          onClick={() => onSelect(msg.generationId!)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 8, marginTop: 4,
            width: '100%', textAlign: 'left',
            border: `1px solid ${isCurrent ? 'var(--ink)' : 'var(--rule)'}`,
            background: 'var(--paper)', borderRadius: 'var(--r-2)', cursor: 'pointer',
            transition: 'all 140ms',
          }}
        >
          <div style={{
            width: 44, aspectRatio: '8.5 / 11',
            borderRadius: 2, flexShrink: 0, overflow: 'hidden',
            background: msg.imageUrl ? 'var(--paper-2)' : '#fbf8f1',
            borderTop: msg.imageUrl ? 'none' : '2px solid var(--accent)',
          }}>
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, flex: 1 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>
              {msg.materialType ? MATERIAL_TYPE_LABELS[msg.materialType] : 'Design'} · v{msg.generationId.slice(-4)}
            </span>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{msg.time}</span>
          </div>
          {isCurrent && (
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Showing
            </span>
          )}
        </button>
      )}
    </div>
  );
}

// ── Chat composer ────────────────────────────────────────────────────────────

function ChatComposer({ onSend, disabled, onAttach }: {
  onSend: (text: string) => void;
  disabled: boolean;
  onAttach?: () => void;
}) {
  const [v, setV] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + 'px';
  }, [v]);

  const submit = () => {
    if (v.trim() && !disabled) { onSend(v.trim()); setV(''); }
  };

  return (
    <div style={{ borderTop: '1px solid var(--rule)', padding: 14, background: 'var(--paper)', flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8, padding: 10,
        border: '1px solid var(--rule)', borderRadius: 'var(--r-3)',
        background: 'var(--paper-2)', transition: 'border-color 140ms',
      }}>
        {onAttach && (
          <button className="btn btn-icon btn-ghost btn-sm" title="Attach reference" onClick={onAttach}>
            <Ico.Image s={15} />
          </button>
        )}
        <textarea
          ref={taRef}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          placeholder="Tweak it — change colours, swap items, add a section…"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            background: 'transparent', padding: '6px 0', maxHeight: 200,
            fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)',
          }}
        />
        <button
          className="btn btn-icon btn-accent btn-sm"
          disabled={!v.trim() || disabled}
          onClick={submit}
          title="Send (⌘↵)"
        >
          <Ico.Send s={14} />
        </button>
      </div>
    </div>
  );
}

// ── Full chat panel (left side in active layout) ──────────────────────────────

interface ChatPanelProps {
  initialValues: PromptValues;
  messages: ChatMessage[];
  generating: boolean;
  currentStepId: string;
  currentGenerationId: string | null;
  onSelectGeneration: (id: string) => void;
  onSend: (text: string) => void;
  onAttach?: () => void;
}

export function ChatPanel({
  initialValues,
  messages,
  generating,
  currentStepId,
  currentGenerationId,
  onSelectGeneration,
  onSend,
  onAttach,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, generating, currentStepId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PromptAsMessage values={initialValues} />

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} style={{
              padding: '12px 16px', borderRadius: 'var(--r-3)',
              background: 'var(--paper-2)', border: '1px solid var(--rule-soft)',
              alignSelf: 'flex-end', maxWidth: '85%',
            }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>You · {m.time}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
            </div>
          ) : (
            <ResultMessage
              key={m.id}
              msg={m}
              isCurrent={m.generationId === currentGenerationId}
              onSelect={onSelectGeneration}
            />
          ),
        )}

        {generating && <GeneratingMessage stepId={currentStepId} />}
      </div>

      <ChatComposer onSend={onSend} disabled={generating} onAttach={onAttach} />
    </div>
  );
}
