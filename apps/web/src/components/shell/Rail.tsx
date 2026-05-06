import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Ico } from './Icons.js';

interface RailProps {
  active: 'create' | 'orders';
  onChange: (tab: 'create' | 'orders') => void;
  collapsed?: boolean;
  onToggle?: () => void;
  compact?: boolean;
  user?: { email: string } | null;
  rightSlot?: ReactNode;
}

const NAV_ITEMS = [
  { id: 'create' as const, label: 'Create', Icon: (p: { size?: number }) => <Sparkles size={p.size ?? 18} strokeWidth={1.4} /> },
  { id: 'orders' as const, label: 'Orders', Icon: Ico.Create },
];

function initials(email: string): string {
  const parts = email.split('@')[0]?.split('.') ?? [];
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function Rail({ active, onChange, collapsed = false, onToggle, compact = false, user, rightSlot }: RailProps) {
  if (compact) {
    return (
      <nav
        className="safe-top safe-x"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 8px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper)',
          flexShrink: 0,
        }}
      >
        <span
          className="font-display"
          style={{ fontSize: 18, lineHeight: 1, padding: '0 8px', color: 'var(--ink)' }}
        >
          hyble
        </span>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`rail-item${active === id ? ' active' : ''}`}
            onClick={() => onChange(id)}
            style={{ flex: 1, justifyContent: 'center', padding: '8px 6px' }}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
        {rightSlot && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {rightSlot}
          </div>
        )}
      </nav>
    );
  }

  return (
    <aside style={{
      width: collapsed ? 48 : 200,
      flexShrink: 0,
      borderRight: '1px solid var(--rule)',
      background: 'var(--paper)',
      padding: collapsed ? '20px 8px' : '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
      transition: 'width 180ms ease, padding 180ms ease',
      overflow: 'hidden',
    }}>
      {/* Logo row + toggle */}
      <div style={{
        padding: collapsed ? '4px 0 18px' : '6px 10px 18px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>hyble</span>
            <span className="eyebrow" style={{ fontSize: 9 }}>v2</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="btn btn-icon btn-ghost btn-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ flexShrink: 0, width: 28, height: 28, padding: 0 }}
        >
          <span style={{ display: 'inline-flex', transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 180ms ease' }}>
            <Ico.Caret s={13} />
          </span>
        </button>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`rail-item${active === id ? ' active' : ''}`}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            style={collapsed ? { justifyContent: 'center', padding: '0' } : {}}
          >
            <Icon />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {user && (
        <div style={{
          borderTop: '1px solid var(--rule)',
          padding: collapsed ? '12px 0 0' : '12px 10px 0',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999, background: 'var(--paper-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', flexShrink: 0,
          }}>
            {initials(user.email)}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </span>
          )}
        </div>
      )}
    </aside>
  );
}
