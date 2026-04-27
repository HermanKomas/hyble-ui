import { useState } from 'react';
import { MATERIAL_TYPE_LABELS, type MaterialType } from '@hyble/shared';
import type { ApiOrder, ApiGeneration } from '../../lib/api.js';
import { orders } from '../../lib/api.js';

interface OrderDetailProps {
  order: ApiOrder;
  onBack: () => void;
  onFinalise: (updated: ApiOrder) => void;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="eyebrow" style={{ paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function Field({ k, v, ok, mono }: { k: string; v: string; ok?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontSize: 12.5 }}>
      <span style={{ color: 'var(--ink-3)' }}>{k}</span>
      <span style={{ color: ok ? 'var(--accent)' : 'var(--ink)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

export function OrderDetail({ order, onBack, onFinalise }: OrderDetailProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const gens = order.generations ?? [];
  const selectedGen: ApiGeneration | undefined = gens[selectedIdx];
  const metadata = selectedGen?.metadata ?? {};

  const handleFinalise = async () => {
    if (!selectedGen) return;
    setSaving(true);
    try {
      const updated = await orders.finalise(order.order.id, selectedGen.id);
      onFinalise({ ...order, order: updated.order });
    } finally {
      setSaving(false);
    }
  };

  const totalCost = gens.reduce((sum, g) => sum + g.cost_cents, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--paper)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span className="eyebrow">{order.order.id.slice(-8)}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{order.customer.name}</span>
        </div>
        <span style={{ flex: 1 }} />
        <span className="badge">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: order.brand_kit.primary_color_hex }} />
          {order.brand_kit.supplier_name}
        </span>
        <span className="badge">{order.customer.primary_state} rules</span>
        <span className="badge" style={{
          background: order.order.status === 'finalised' ? 'var(--accent-soft)' : 'transparent',
          color: order.order.status === 'finalised' ? 'var(--accent)' : 'var(--ink-3)',
        }}>
          {order.order.status}
        </span>
      </div>

      {gens.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
          No generations yet.
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 300px', minHeight: 0 }}>
          {/* Generations rail */}
          <div style={{ borderRight: '1px solid var(--rule)', overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow" style={{ padding: '4px 4px 8px' }}>generations · {gens.length}</div>
            {gens.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', gap: 10, padding: 8, alignItems: 'center',
                  background: selectedIdx === i ? 'var(--paper-2)' : 'transparent',
                  border: selectedIdx === i ? '1px solid var(--rule)' : '1px solid transparent',
                  borderRadius: 'var(--r-2)', cursor: 'pointer', textAlign: 'left', color: 'var(--ink)', width: '100%',
                }}
              >
                <div style={{ width: 36, aspectRatio: '8.5/11', background: '#fbf8f1', borderTop: `3px solid ${order.brand_kit.primary_color_hex}`, borderRadius: 1, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: 13 }}>v{i + 1}</span>
                  <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                    {new Date(g.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${(g.cost_cents / 100).toFixed(2)}
                  </span>
                </div>
                {i === gens.length - 1 && (
                  <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--accent)', letterSpacing: '.1em' }}>LATEST</span>
                )}
                {order.order.final_generation_id === g.id && (
                  <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--ok)', letterSpacing: '.1em' }}>FINAL</span>
                )}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div style={{ overflow: 'auto', padding: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'var(--paper-2)' }}>
            {selectedGen?.output_image_url ? (
              <img
                src={selectedGen.output_image_url}
                alt={`Generation v${selectedIdx + 1}`}
                style={{ maxWidth: '100%', borderRadius: 4, boxShadow: 'var(--shadow-3)' }}
              />
            ) : (
              <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>No preview</div>
            )}
          </div>

          {/* Metadata panel */}
          <div style={{ borderLeft: '1px solid var(--rule)', overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Section label="Material">
              <Field k="Type" v={MATERIAL_TYPE_LABELS[order.order.material_type as MaterialType] ?? order.order.material_type} />
              <Field k="Customer" v={order.customer.name} />
              <Field k="State" v={order.customer.primary_state} />
            </Section>

            <Section label="Metadata">
              <Field k="Format" v={String(metadata['format'] ?? '—')} />
              <Field k="Designation" v={String(metadata['designation_code'] ?? '—')} />
              <Field k="Supplier" v={String(metadata['supplier'] ?? order.brand_kit.supplier_name)} />
            </Section>

            <Section label="Cost">
              <Field k="Generations" v={`${gens.length}`} />
              <Field k="Total" v={`$${(totalCost / 100).toFixed(2)}`} mono />
            </Section>

            {order.order.status !== 'finalised' && (
              <button
                className="btn btn-accent"
                style={{ marginTop: 'auto' }}
                disabled={saving || !selectedGen}
                onClick={handleFinalise}
              >
                {saving ? 'Saving…' : 'Mark as final'}
              </button>
            )}

            {order.order.status === 'finalised' && (
              <div style={{ marginTop: 'auto', padding: '10px 14px', borderRadius: 'var(--r-2)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '.06em', textAlign: 'center' }}>
                FINALISED · ready for print pipeline
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
