"use client";

import { useRafClock, formatClock } from "@/hooks/useClock";

// HH:MM:SS:cc 表示。各文字を固定幅で並べ、フォントの字幅差による
// 桁揺れを完全に防ぐ
export function DigitalClock({ className = "" }: { className?: string }) {
  const now = useRafClock();
  const text = formatClock(now);

  return (
    <time
      dateTime={now.toISOString()}
      aria-label={`現在時刻 ${text}`}
      className={`whitespace-nowrap font-clock font-black tabular-nums leading-none tracking-tight text-black ${className}`}
    >
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`inline-block text-center ${
            ch === ":" ? "w-[0.32em]" : "w-[0.62em]"
          }`}
        >
          {ch}
        </span>
      ))}
    </time>
  );
}
