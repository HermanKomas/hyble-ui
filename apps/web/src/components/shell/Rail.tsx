import { Ico } from './Icons.js';

interface RailProps {
  active: 'create' | 'orders';
  onChange: (tab: 'create' | 'orders') => void;
  compact?: boolean;
  user?: { email: string } | null;
}

const NAV_ITEMS = [
  { id: 'create' as const, label: 'Create', Icon: Ico.Create },
  { id: 'orders' as const, label: 'Orders', Icon: Ico.Orders },
];

function initials(email: string): string {
  const parts = email.split('@')[0]?.split('.') ?? [];
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Rail({ active, onChange, compact = false, user }: RailProps) {
  if (compact) {
    return (
      <nav style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--rule)', background: 'var(--paper)' }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`rail-item${active === id ? ' active' : ''}`}
            onClick={() => onChange(id)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <aside style={{
      width: 200, flexShrink: 0, borderRight: '1px solid var(--rule)',
      background: 'var(--paper)', padding: '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ padding: '6px 10px 18px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>hyble</span>
        <span className="eyebrow" style={{ fontSize: 9 }}>v2</span>
      </div>

      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`rail-item${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon /> <span>{label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {user && (
        <div style={{
          borderTop: '1px solid var(--rule)', paddingTop: 12, marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 10px 0',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999, background: 'var(--paper-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)',
          }}>
            {initials(user.email)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{user.email}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
