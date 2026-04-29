import { useState, useRef, useEffect } from 'react';
import { Ico } from '../shell/Icons.js';
import type { MaterialType } from '@hyble/shared';
import { MATERIAL_TYPE_LABELS } from '@hyble/shared';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CustomerOption {
  id: string;
  name: string;
  primary_state: string;
  supplier_name: string;
  primary_color_hex: string;
}

export interface PromptValues {
  materialType: MaterialType | null;
  customer: CustomerOption | null;
  image: { name: string; key?: string; src?: string } | null;
  notes: string;
  size: string | null;
}

interface PopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  align?: 'left' | 'right';
}

// ── Popover ──────────────────────────────────────────────────────────────────

function Popover({ open, anchorRef, onClose, children, width = 280, align = 'left' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const root = anchorRef.current.closest('[data-popover-root]');
    const containerRect = root?.getBoundingClientRect();
    const ox = containerRect?.left ?? 0;
    const oy = containerRect?.top ?? 0;
    setPos({ left: r.left - ox + (align === 'right' ? r.width - width : 0), top: r.bottom - oy + 8 });
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} style={{
      position: 'absolute', left: pos.left, top: pos.top, width, zIndex: 50,
      background: 'var(--paper)', border: '1px solid var(--rule)',
      borderRadius: 'var(--r-3)', boxShadow: 'var(--shadow-3)',
      padding: 6, animation: 'fadeUp 180ms var(--ease-out) both',
    }}>
      {children}
    </div>
  );
}

// ── Material type picker ──────────────────────────────────────────────────────

const MATERIAL_TYPES: Array<{ v: MaterialType; hint: string }> = [
  { v: 'menu',         hint: 'by-the-glass + bottle' },
  { v: 'tent_card',    hint: 'compact folded format' },
  { v: 'bar_top_card', hint: 'single product focus' },
];

const SIZES_BY_TYPE: Partial<Record<MaterialType, string[]>> = {
  menu:         ['4" × 6" 2-sided Menu (US)', '2 Page A5 (Europe)', '2 Page A6 (Europe)'],
  tent_card:    ['4" × 6" Tent Card (US)', 'A5 Tent Card (Europe)'],
  bar_top_card: ['4" × 4" Coaster (US)'],
};

function TypePicker({ value, onChange, anchorRef, open, onClose }: {
  value: MaterialType | null;
  onChange: (v: MaterialType) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={260}>
      <div className="eyebrow" style={{ padding: '6px 8px 4px' }}>material type</div>
      {MATERIAL_TYPES.map((t) => (
        <button key={t.v} onClick={() => { onChange(t.v); onClose(); }} style={{
          display: 'flex', flexDirection: 'column', width: '100%', gap: 2,
          padding: '8px 10px', borderRadius: 'var(--r-2)',
          background: value === t.v ? 'var(--paper-2)' : 'transparent',
          border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)',
        }}>
          <span style={{ fontSize: 14 }}>{MATERIAL_TYPE_LABELS[t.v]}</span>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t.hint}</span>
        </button>
      ))}
    </Popover>
  );
}

// ── Size picker ───────────────────────────────────────────────────────────────

function SizePicker({ sizes, value, onChange, anchorRef, open, onClose }: {
  sizes: string[];
  value: string | null;
  onChange: (v: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={260}>
      <div className="eyebrow" style={{ padding: '6px 8px 4px' }}>size</div>
      {sizes.map((s) => (
        <button key={s} onClick={() => { onChange(s); onClose(); }} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          padding: '9px 10px', borderRadius: 'var(--r-2)',
          background: value === s ? 'var(--paper-2)' : 'transparent',
          border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', fontSize: 14,
        }}>
          {s}
          {value === s && <Ico.Check />}
        </button>
      ))}
    </Popover>
  );
}

// ── Customer picker ───────────────────────────────────────────────────────────

function CustomerPicker({ value, onChange, anchorRef, open, onClose, customers }: {
  value: CustomerOption | null;
  onChange: (c: CustomerOption) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  customers: CustomerOption[];
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = customers.filter((c) =>
    (c.name + c.supplier_name + c.primary_state).toLowerCase().includes(q.toLowerCase()),
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ('');
  }, [open]);

  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={320}>
      <div style={{ padding: '4px 4px 6px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--rule-soft)' }}>
        <Ico.Search />
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)', padding: '4px 0' }}
        />
      </div>
      <div style={{ maxHeight: 280, overflow: 'auto', paddingTop: 4 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: 13, color: 'var(--ink-3)' }}>No customers match "{q}".</div>
        )}
        {filtered.map((c) => (
          <button key={c.id} onClick={() => { onChange(c); onClose(); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            padding: '8px 10px', borderRadius: 'var(--r-2)',
            background: value?.id === c.id ? 'var(--paper-2)' : 'transparent',
            border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)',
          }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14 }}>{c.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{c.supplier_name} · {c.primary_state}</span>
            </span>
            {value?.id === c.id && <Ico.Check />}
          </button>
        ))}
      </div>
    </Popover>
  );
}


// ── Main sentence ─────────────────────────────────────────────────────────────

interface PromptSentenceProps {
  values: PromptValues;
  setValues: React.Dispatch<React.SetStateAction<PromptValues>>;
  customers: CustomerOption[];
  onGenerate: () => void;
  busy: boolean;
  onUploadImage?: (file: File) => Promise<{ key: string }>;
}

export function PromptSentence({ values, setValues, customers, onGenerate, busy, onUploadImage }: PromptSentenceProps) {
  const [openSlot, setOpenSlot] = useState<'type' | 'size' | 'customer' | null>(null);
  const tRef = useRef<HTMLButtonElement>(null);
  const sRef = useRef<HTMLButtonElement>(null);
  const cRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizesForType = values.materialType ? (SIZES_BY_TYPE[values.materialType] ?? null) : null;
  const ready = values.materialType !== null && values.customer !== null && (!sizesForType || values.size !== null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const src = URL.createObjectURL(f);
    setValues((v) => ({ ...v, image: { name: f.name, src } }));
    e.target.value = '';
    // Upload in background for the storage key
    if (onUploadImage) {
      onUploadImage(f)
        .then(({ key }) => setValues((v) => v.image ? { ...v, image: { ...v.image, key } } : v))
        .catch(() => {});
    }
  };

  const typeLabel = values.materialType ? MATERIAL_TYPE_LABELS[values.materialType] : null;

  return (
    <div data-popover-root style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 18, textAlign: 'center' }}>Let's create a POS material</div>

      <p className="prompt-sentence">
        <span className="static">Create a </span>
        <button
          ref={tRef}
          className={`slot${values.materialType ? ' filled' : ''}`}
          onClick={() => setOpenSlot((s) => (s === 'type' ? null : 'type'))}
        >
          {typeLabel ?? 'material type'} <Ico.Caret />
        </button>
        {sizesForType && (
          <>
            <span className="static"> in </span>
            <button
              ref={sRef}
              className={`slot${values.size ? ' filled' : ''}`}
              onClick={() => setOpenSlot((s) => (s === 'size' ? null : 'size'))}
            >
              {values.size ?? 'select a size'} <Ico.Caret />
            </button>
          </>
        )}
        <span className="static"> for </span>
        <button
          ref={cRef}
          className={`slot${values.customer ? ' filled' : ''}`}
          onClick={() => setOpenSlot((s) => (s === 'customer' ? null : 'customer'))}
        >
          {values.customer?.name ?? 'a customer'} <Ico.Caret />
        </button>
        <span className="static">.</span>
        <span style={{ display: 'block', height: 14 }} />
        <button
          className={`slot${values.image ? ' filled' : ''}`}
          onClick={() => values.image ? setValues((v) => ({ ...v, image: null })) : fileInputRef.current?.click()}
          style={{ fontSize: '0.62em', verticalAlign: 'middle' }}
        >
          {values.image ? (
            <span><Ico.Image s={14} /> existing menu photo: {values.image.name} · <em style={{ fontStyle: 'normal', opacity: 0.6 }}>remove</em></span>
          ) : (
            <span><Ico.Plus /> attach an existing piece (optional)</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </p>

      {/* Notes */}
      <div style={{ marginTop: 28, position: 'relative' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          changes or notes{' '}
          <span style={{ color: 'var(--ink-4)', textTransform: 'none', letterSpacing: 'normal', fontFamily: 'var(--font-ui)', fontSize: 11.5 }}>
            · optional
          </span>
        </div>
        <textarea
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          placeholder="e.g. portrait orientation, swap Buffalo Trace for Eagle Rare, add a seasonal cocktails block at the top…"
          rows={3}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 'var(--r-3)',
            border: '1px solid var(--rule)', background: 'var(--paper-2)',
            color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 14.5,
            lineHeight: 1.55, resize: 'vertical', outline: 'none',
            transition: 'border-color 140ms',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--rule)')}
        />
      </div>

      {/* Submit row */}
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-3)' }}>
          {values.customer ? (
            <>
              <span className="badge">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: values.customer.primary_color_hex }} />
                {values.customer.supplier_name}
              </span>
              <span className="badge">{values.customer.primary_state} rules</span>
            </>
          ) : (
            <span style={{ fontStyle: 'italic' }}>brand kit + state rules apply automatically</span>
          )}
        </div>
        <button className="btn btn-accent btn-lg" disabled={!ready || busy} onClick={onGenerate}>
          {busy ? <><Ico.Spinner /> Generating…</> : <>Generate <span style={{ opacity: 0.7, fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 4 }}>⌘↵</span></>}
        </button>
      </div>

      {/* Popovers */}
      <TypePicker
        value={values.materialType}
        onChange={(v) => {
          const firstSize = SIZES_BY_TYPE[v]?.[0] ?? null;
          setValues((s) => ({ ...s, materialType: v, size: firstSize }));
        }}
        anchorRef={tRef}
        open={openSlot === 'type'}
        onClose={() => setOpenSlot(null)}
      />
      {sizesForType && (
        <SizePicker
          sizes={sizesForType}
          value={values.size}
          onChange={(v) => setValues((s) => ({ ...s, size: v }))}
          anchorRef={sRef}
          open={openSlot === 'size'}
          onClose={() => setOpenSlot(null)}
        />
      )}
      <CustomerPicker
        value={values.customer}
        onChange={(c) => setValues((s) => ({ ...s, customer: c }))}
        anchorRef={cRef}
        open={openSlot === 'customer'}
        onClose={() => setOpenSlot(null)}
        customers={customers}
      />
    </div>
  );
}
