"use client";

import { useState, useEffect } from "react";

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

// センチ秒表示用。setInterval ではなく requestAnimationFrame で
// 描画フレームごとに更新する（reduced motion 時は秒単位に落とす）
export function useRafClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      setNow(new Date());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return now;
}

export function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const cs = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, "0");
  return `${h}:${m}:${s}:${cs}`;
}

export function localTime(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "--:--";
  }
}
