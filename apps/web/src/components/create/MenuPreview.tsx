import type { CustomerOption } from './PromptSentence.js';
import type { MaterialType } from '@hyble/shared';
import { Ico } from '../shell/Icons.js';

interface DesignArtProps {
  customer: CustomerOption | null;
  materialType: MaterialType | null;
  reveal: number;
  imageUrl?: string;
}

export function DesignArt({ reveal, imageUrl }: DesignArtProps) {
  // Real image ready — show it
  if (imageUrl && reveal >= 1) {
    return (
      <div style={{
        width: '100%', maxWidth: 520, margin: '0 auto',
        borderRadius: 4, boxShadow: 'var(--shadow-3)', overflow: 'hidden',
      }}>
        <img src={imageUrl} alt="Generated POS material" style={{ width: '100%', display: 'block' }} />
      </div>
    );
  }

  // Generic skeleton — no fake content, just shimmer blocks
  const rows = [0.75, 0.55, 0.9, 0.6, 0.8, 0.5, 0.7, 0.65, 0.85, 0.45, 0.72, 0.58, 0.88, 0.62];
  return (
    <div style={{
      width: '100%', aspectRatio: '8.5 / 11', maxWidth: 520, margin: '0 auto',
      background: 'var(--paper)', borderRadius: 4, boxShadow: 'var(--shadow-3)',
      padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 3, alignSelf: 'center' }} />
      <div className="skeleton" style={{ height: 28, width: '60%', borderRadius: 4, alignSelf: 'center', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 8, width: '30%', borderRadius: 3, alignSelf: 'center' }} />

      <div style={{ height: 1, background: 'var(--rule)', margin: '6px 0' }} />

      {/* Two-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[0, 1].map((col) => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="skeleton" style={{ height: 8, width: '55%', borderRadius: 3 }} />
            {rows.slice(col * 7, col * 7 + 7).map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="skeleton" style={{ height: 11, width: `${w * 100}%`, borderRadius: 3 }} />
                <div className="skeleton" style={{ height: 8, width: `${(w * 0.7) * 100}%`, borderRadius: 2 }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--rule)', margin: '4px 0' }} />
      <div className="skeleton" style={{ height: 7, width: '50%', borderRadius: 2, alignSelf: 'center' }} />
    </div>
  );
}

// ── Preview surface (right panel) ─────────────────────────────────────────────

interface MenuPreviewSurfaceProps {
  customer: CustomerOption | null;
  materialType: MaterialType | null;
  status: 'empty' | 'generating' | 'done';
  reveal: number;
  imageUrl?: string;
  hasFinal: boolean;
  onRegen: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export function MenuPreviewSurface({ customer, materialType, status, reveal, imageUrl, hasFinal, onRegen, onSave, onDownload }: MenuPreviewSurfaceProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--paper-2)', borderLeft: '1px solid var(--rule)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--rule)', gap: 10, flexShrink: 0 }}>
        <span className="eyebrow">Design</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" disabled={!hasFinal} onClick={onDownload}><Ico.Download />Download</button>
        <button className="btn btn-sm" disabled={!hasFinal} onClick={onRegen}>
          <Ico.Refresh />Regenerate <span style={{ opacity: 0.5, fontFamily: 'var(--font-mono)', fontSize: 10, marginLeft: 2 }}>~$0.04</span>
        </button>
        <button className="btn btn-sm btn-accent" disabled={!hasFinal} onClick={onSave}>
          <Ico.Save />Save to order
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '36px 32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {status === 'empty' ? (
          <div style={{ alignSelf: 'center', textAlign: 'center', color: 'var(--ink-3)', maxWidth: 320 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-2)', marginBottom: 8 }}>
              The page begins empty.
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              Fill in the sentence on the left. Your design will appear here as it's generated.
            </div>
          </div>
        ) : (
          <DesignArt
            customer={customer}
            materialType={materialType}
            reveal={reveal}
            imageUrl={imageUrl}
          />
        )}
      </div>
    </div>
  );
}
