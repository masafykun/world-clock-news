interface EarthIconProps {
  expanded: boolean;
}

export function EarthIcon({ expanded }: EarthIconProps) {
  const size = expanded
    ? "h-64 w-64 sm:h-72 sm:w-72 md:h-80 md:w-80"
    : "h-[22rem] w-[22rem] sm:h-[30rem] sm:w-[30rem] md:h-[38rem] md:w-[38rem]";

  return (
    <div className={`relative rounded-full ${size}`}>
      <svg
        viewBox="0 0 240 240"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="oceanGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(236,72,153,0.05)" />
          </radialGradient>
          <filter id="earthGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="continentGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 海洋（淡い背景） */}
        <circle cx="120" cy="120" r="108" fill="url(#oceanGrad)" />
        {/* 外枠リング */}
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke="rgba(236,72,153,0.35)"
          strokeWidth="2.5"
          filter="url(#earthGlow)"
        />
        {/* 内側の装飾リング */}
        <circle
          cx="120"
          cy="120"
          r="98"
          fill="none"
          stroke="rgba(236,72,153,0.10)"
          strokeWidth="1"
        />
        {/* 赤道ライン */}
        <ellipse
          cx="120"
          cy="120"
          rx="108"
          ry="25"
          fill="none"
          stroke="rgba(236,72,153,0.08)"
          strokeWidth="1"
        />

        {/* 大陸（ピンク系） */}
        <g
          fill="#ec4899"
          opacity="0.9"
          filter="url(#continentGlow)"
        >
          {/* アジア・ユーラシア東部 */}
          <path d="M138 32c14-6 32-4 46 6 10 7 18 18 15 30-4 14-18 16-30 9-10-7-16-18-28-19-13-1-22 10-30 20-8 9-18 12-26 4-9-9-5-26 6-37 8-8 18-8 33-13-2 0 8 1 14 0z" />
          {/* 유럽 */}
          <path d="M82 44c8-3 18 0 24 7 5 6 4 14-2 19-7 6-16 6-24 2-8-4-12-12-10-20 1-5 6-7 12-8z" />
          {/* 아프리카 */}
          <path d="M95 105c12 4 22 14 24 26 2 12-8 20-20 18-14-2-25-13-27-27-2-10 5-18 14-19 3 0 6 1 9 2z" />
          {/* 남아시아 */}
          <path d="M162 80c14 5 26 16 32 29 5 11 2 23-8 29-13 7-28 3-37-9-8-10-8-24 0-34 5-7 8-12 13-15z" />
          {/* 동남아시아 */}
          <path d="M188 122c10-2 20 3 26 12 5 8 3 18-5 23-9 6-21 4-28-4-6-7-6-17 0-25 2-3 5-5 7-6z" />
          {/* 아메리카 북부 */}
          <path d="M38 62c10-3 22 2 30 10 7 8 8 20 2 29-7 10-20 13-31 8-11-5-17-17-14-29 2-9 7-15 13-18z" />
          {/* 남아메리카 */}
          <path d="M52 130c10 6 17 16 18 27 1 10-7 18-17 17-12-1-22-10-24-22-2-10 4-19 12-22 4-1 8-1 11 0z" />
          {/* 오세아니아 */}
          <path d="M185 162c12-2 23 4 29 14 5 9 2 20-7 25-11 7-26 4-33-7-6-9-4-21 4-27 2-2 4-4 7-5z" />
        </g>

        {/* 光沢ハイライト */}
        <ellipse
          cx="88"
          cy="72"
          rx="28"
          ry="18"
          fill="rgba(255,255,255,0.18)"
          transform="rotate(-30 88 72)"
        />
      </svg>
    </div>
  );
}
