import { Ico } from '../shell/Icons.js';
import { MATERIAL_TYPE_LABELS, type MaterialType } from '@hyble/shared';
import { useState } from 'react';
import type { ApiOrder } from '../../lib/api.js';

interface OrdersListProps {
  orders: ApiOrder[];
  onOpen: (order: ApiOrder) => void;
  onCreateNew: () => void;
}

export function OrdersList({ orders, onOpen, onCreateNew }: OrdersListProps) {
  const [q, setQ] = useState('');

  const filtered = orders.filter((o) =>
    (o.customer.name + o.order.id + o.brand_kit.supplier_name)
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  if (orders.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--paper)' }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ width: 84, height: 100, border: '1.5px dashed var(--rule)', borderRadius: 4, margin: '0 auto 18px', position: 'relative', background: 'var(--paper-2)' }}>
            <div style={{ position: 'absolute', top: 8, left: 12, right: 12, height: 3, background: 'var(--rule)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 18, left: 12, right: 24, height: 2, background: 'var(--rule)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 26, left: 12, right: 18, height: 2, background: 'var(--rule)', borderRadius: 2 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 6 }}>No orders yet.</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 16 }}>
            Create a POS piece and save it. Anything you ship to print will show up here, with metadata flowing through to chargeback.
          </div>
          <button className="btn btn-accent" onClick={onCreateNew}>Create your first piece</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--paper)', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 32, border: '1px solid var(--rule)', borderRadius: 'var(--r-2)', background: 'var(--paper-2)', flex: 1, maxWidth: 320 }}>
          <Ico.Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orders, customers…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)' }}
          />
        </div>
        <span style={{ flex: 1 }} />
        <span className="eyebrow">{filtered.length} orders</span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 140px 140px 90px 60px', gap: 16, padding: '10px 24px', borderBottom: '1px solid var(--rule-soft)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', flexShrink: 0 }}>
        <span />
        <span>Customer</span>
        <span>Brand</span>
        <span>Type</span>
        <span>Date</span>
        <span style={{ textAlign: 'right' }}>ID</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map((o) => (
          <button
            key={o.order.id}
            onClick={() => onOpen(o)}
            style={{
              display: 'grid', gridTemplateColumns: '22px 1fr 140px 140px 90px 60px', gap: 16, alignItems: 'center',
              padding: '14px 24px', width: '100%',
              background: 'var(--paper)', border: 'none', borderBottom: '1px solid var(--rule-soft)',
              cursor: 'pointer', textAlign: 'left', color: 'var(--ink)', transition: 'background 120ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--paper)')}
          >
            <span style={{ width: 14, height: 18, background: '#fbf8f1', borderTop: `3px solid ${o.brand_kit.primary_color_hex}`, borderRadius: 1 }} />
            <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              {o.customer.name}
              {o.order.status === 'draft' && (
                <span className="badge" style={{ background: 'transparent', color: 'var(--ink-3)' }}>Draft</span>
              )}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{o.brand_kit.supplier_name}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {MATERIAL_TYPE_LABELS[o.order.material_type as MaterialType] ?? o.order.material_type}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
              {new Date(o.order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textAlign: 'right' }}>
              {o.order.id.slice(-6)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
