/**
 * 地の模様。抽象的なノイズではなく、ピッチの線そのものを引く。
 * タッチライン／ハーフウェイライン／センターサークル／ペナルティエリア／コーナーアーク。
 * 文字の背後に来るので、線は極端に薄くし、わずかに荒らす（本文には掛けない）。
 */
export default function PitchLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <filter id="chalk">
          {/* 白線のかすれ。背景線だけに使う */}
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
      </defs>
      <g
        filter="url(#chalk)"
        fill="none"
        stroke="var(--chalk)"
        strokeOpacity="0.07"
        strokeWidth="1.6"
      >
        {/* タッチラインとゴールライン */}
        <rect x="40" y="30" width="920" height="560" />
        {/* ハーフウェイラインとセンターサークル */}
        <line x1="500" y1="30" x2="500" y2="590" />
        <circle cx="500" cy="310" r="88" />
        <circle cx="500" cy="310" r="3" strokeOpacity="0.14" />
        {/* ペナルティエリアとゴールエリア */}
        <rect x="40" y="140" width="150" height="340" />
        <rect x="40" y="225" width="60" height="170" />
        <rect x="810" y="140" width="150" height="340" />
        <rect x="900" y="225" width="60" height="170" />
        {/* ペナルティアーク */}
        <path d="M190 250 A 88 88 0 0 1 190 370" />
        <path d="M810 250 A 88 88 0 0 0 810 370" />
        {/* コーナーアーク */}
        <path d="M40 48 A 18 18 0 0 0 58 30" />
        <path d="M942 30 A 18 18 0 0 0 960 48" />
        <path d="M40 572 A 18 18 0 0 1 58 590" />
        <path d="M942 590 A 18 18 0 0 1 960 572" />
      </g>
    </svg>
  );
}
