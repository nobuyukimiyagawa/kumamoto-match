/**
 * ロゴマーク（案B「ピッチ・ピン」）。縦のサッカーピッチが地図のピンになっている。
 * 線は currentColor、センターサークルの点だけレーダーの緑。
 * 正本は docs/logo/pitchmate-mark.svg
 */
export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        <path d="M26 6 H74 A10 10 0 0 1 84 16 V60 A10 10 0 0 1 74 70 H60 L50 94 L40 70 H26 A10 10 0 0 1 16 60 V16 A10 10 0 0 1 26 6 Z" strokeWidth="4.5" />
        <line x1="16" y1="38" x2="84" y2="38" strokeWidth="3" opacity=".6" />
        <rect x="36" y="6" width="28" height="9" strokeWidth="2.5" opacity=".6" />
        <rect x="36" y="61" width="28" height="9" strokeWidth="2.5" opacity=".6" />
        <circle cx="50" cy="38" r="9" strokeWidth="3" />
      </g>
      <circle cx="50" cy="38" r="4" fill="var(--primary)" />
    </svg>
  );
}
