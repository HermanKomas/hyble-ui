import { useEffect, type ReactNode } from 'react';
import { Ico } from './Icons.js';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// Modal bottom sheet for mobile pickers. Backdrop + slide-up sheet.
// Locks body scroll while open and closes on escape.
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <span className="sheet-handle" />
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 16px 10px', borderBottom: '1px solid var(--rule-soft)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)',
            }}>
              {title}
            </span>
            <button
              onClick={onClose}
              className="btn btn-icon btn-ghost btn-sm"
              aria-label="Close"
            >
              <Ico.Close s={14} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
}
