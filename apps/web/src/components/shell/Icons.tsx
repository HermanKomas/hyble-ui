// Hand-set SVG icons — no third-party icon set. Ported 1:1 from design handover.

interface IconProps { s?: number }

export const Ico = {
  Create: ({ s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7M3 7h12M3 11h9M3 15h6"/>
    </svg>
  ),
  Orders: ({ s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="12" height="12" rx="1.5"/>
      <path d="M3 7h12M7 3v12"/>
    </svg>
  ),
  Plus: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 3v8M3 7h8"/></svg>
  ),
  Image: ({ s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="10" rx="1.5"/>
      <circle cx="6" cy="7" r="1.2"/>
      <path d="m2.5 11.5 3.5-3 3 2.5 2-1.5 2.5 2"/>
    </svg>
  ),
  Send: ({ s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8 14 2l-4 12-2-5z"/>
    </svg>
  ),
  Refresh: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7a5 5 0 0 1 8.5-3.5L12 5M12 7a5 5 0 0 1-8.5 3.5L2 9"/>
      <path d="M12 2v3h-3M2 12V9h3"/>
    </svg>
  ),
  Download: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v7M4 6l3 3 3-3M2 11h10"/>
    </svg>
  ),
  Save: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h6l3 3v7H3z"/>
      <path d="M5 2v3h4M5 9h4"/>
    </svg>
  ),
  Search: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="6" cy="6" r="3.5"/><path d="m9 9 3 3"/>
    </svg>
  ),
  Sun: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7" cy="7" r="2.4"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.7 2.7l1 1M10.3 10.3l1 1M2.7 11.3l1-1M10.3 3.7l1-1"/>
    </svg>
  ),
  Moon: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 8.5A4.5 4.5 0 0 1 5.5 3a4.5 4.5 0 1 0 5.5 5.5z"/>
    </svg>
  ),
  Check: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 7 3 3 5-6"/>
    </svg>
  ),
  Spinner: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" strokeOpacity="0.2"/>
      <path d="M12 7a5 5 0 0 0-5-5">
        <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="0.9s" repeatCount="indefinite"/>
      </path>
    </svg>
  ),
  Camera: ({ s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="10" rx="1.5"/>
      <circle cx="9" cy="10" r="2.6"/>
      <path d="M6 5l1-1.5h4L12 5"/>
    </svg>
  ),
  Caret: ({ s = 10 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 4 2.5 2.5L7.5 4"/>
    </svg>
  ),
  Close: ({ s = 12 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 3l6 6M9 3l-6 6"/>
    </svg>
  ),
  Alert: ({ s = 14 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2 1 12h12L7 2z"/>
      <path d="M7 6v3M7 11v.01"/>
    </svg>
  ),
};
