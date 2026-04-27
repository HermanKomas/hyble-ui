import type { ReactNode } from 'react';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function HeaderBar({ title, subtitle, right }: HeaderBarProps) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 28px',
      borderBottom: '1px solid var(--rule)', background: 'var(--paper)',
      minHeight: 64, flexShrink: 0,
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        {subtitle && <span className="eyebrow" style={{ fontSize: 10 }}>{subtitle}</span>}
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)' }}>{title}</span>
      </div>
      {right && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
      )}
    </header>
  );
}
