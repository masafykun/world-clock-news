"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useClock } from "@/hooks/useClock";
import { useNews } from "@/hooks/useNews";
import { buildBubbleLayout, rotateNewsByHour, type BubbleItem } from "@/lib/bubbleLayout";
import { pickHighlights } from "@/lib/news/highlights";
import { DotGlobe } from "./DotGlobe";
import { DigitalClock } from "./DigitalClock";
import { NewsBubble } from "./NewsBubble";
import { DetailPanel } from "./DetailPanel";

/** ニュースを出してから自動で引っ込めるまでの時間 */
const AUTO_HIDE_MS = 5 * 60 * 1000;

interface State {
  newsVisible: boolean;
  selected: BubbleItem | null;
  /** ニュースを出した時刻(ms)。自動で引っ込めるまでの計測に使う。 */
  shownAt: number | null;
}

type Action =
  | { type: "SHOW_NEWS" }
  | { type: "HIDE_NEWS" }
  | { type: "SELECT"; item: BubbleItem }
  | { type: "DESELECT" }
  | { type: "BACKGROUND_CLICK" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SHOW_NEWS":
      if (state.newsVisible) return state;
      return { ...state, newsVisible: true, shownAt: Date.now() };
    case "HIDE_NEWS":
      if (!state.newsVisible) return state;
      return { ...state, newsVisible: false, selected: null, shownAt: null };
    case "SELECT":
      return { ...state, selected: action.item };
    case "DESELECT":
      return { ...state, selected: null };
    case "BACKGROUND_CLICK":
      if (!state.newsVisible)
        return { ...state, newsVisible: true, shownAt: Date.now() };
      // 詳細パネルが開いていれば、まずそれを閉じる
      if (state.selected) return { ...state, selected: null };
      // 何も開いていない状態で再度クリックされたら時計だけに戻す
      return { ...state, newsVisible: false, selected: null, shownAt: null };
    default:
      return state;
  }
}

export default function WorldClockNewsBubbles() {
  const now = useClock(1000);
  const { items, loading, error, source } = useNews();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const [{ newsVisible, selected, shownAt }, dispatch] = useReducer(reducer, {
    newsVisible: false,
    selected: null,
    shownAt: null,
  });

  // コンテナサイズ（レスポンシブ対応）
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = containerSize;
  const centerX = width / 2;
  const centerY = height / 2;

  // 時間帯でニュースをローテーション
  const activeHour = now.getHours();
  const rotated = useMemo(
    () => rotateNewsByHour(items, activeHour),
    [items, activeHour]
  );
  // 毎時00分になったら自動でニュースを出す（クリックと同じ状態）。
  // 同じ時刻で何度も発火しないよう、処理済みの「時」を覚えておく。
  const handledHourRef = useRef<number | null>(null);
  useEffect(() => {
    if (now.getMinutes() !== 0) return;
    const stamp = now.getHours();
    if (handledHourRef.current === stamp) return;
    handledHourRef.current = stamp;
    dispatch({ type: "SHOW_NEWS" });
  }, [now]);

  // 表示から5分経ったら時計だけの状態へ戻す（自動・手動どちらの表示でも同じ）。
  useEffect(() => {
    if (!newsVisible || shownAt === null) return;
    const elapsed = Date.now() - shownAt;
    const remain = AUTO_HIDE_MS - elapsed;
    if (remain <= 0) {
      dispatch({ type: "HIDE_NEWS" });
      return;
    }
    const timer = setTimeout(() => dispatch({ type: "HIDE_NEWS" }), remain);
    return () => clearTimeout(timer);
  }, [newsVisible, shownAt]);

  // インパクトのある数件だけに絞る（件数が多いと情報過多になるため）
  const highlights = useMemo(
    () => pickHighlights(rotated, activeHour),
    [rotated, activeHour]
  );
  const bubbles = useMemo(
    () => buildBubbleLayout(highlights, width, height),
    [highlights, width, height]
  );

  const handleBubbleClick = useCallback(
    (item: BubbleItem) => dispatch({ type: "SELECT", item }),
    []
  );

  const handleBackgroundClick = useCallback(
    () => dispatch({ type: "BACKGROUND_CLICK" }),
    []
  );

  return (
    <div
      className="relative min-h-screen cursor-pointer select-none overflow-hidden bg-[#fefdfb]"
      onClick={handleBackgroundClick}
      aria-label={
        newsVisible
          ? "背景をクリックすると詳細が閉じます"
          : "クリックすると世界のニュースが表示されます"
      }
    >

      {/* メインエリア */}
      <main
        ref={containerRef}
        className="relative z-10 mx-auto h-[calc(100svh-72px)] max-h-[800px] min-h-[500px] w-full"
      >
        {/* 中央: 回転する地球儀（マゼンタのハーフトーンドット） */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <motion.div
            animate={{ scale: newsVisible ? 0.8 : 1 }}
            transition={{ duration: 0.45, type: "spring", stiffness: 90, damping: 16 }}
            className="h-[min(100vw,95svh,900px)] w-[min(100vw,95svh,900px)]"
          >
            <DotGlobe className="h-full w-full" />
          </motion.div>
        </div>

        {/* バブル接続ライン（SVG） */}
        <AnimatePresence>
          {newsVisible && (
            <motion.svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            >
              {bubbles.map((item) => (
                <motion.line
                  key={`line-${item.id}`}
                  x1={centerX}
                  y1={centerY}
                  x2={item.x}
                  y2={item.y}
                  stroke="rgba(236,72,153,0.22)"
                  strokeWidth="1"
                  initial={prefersReducedMotion ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { delay: item.delay, duration: 0.7 }
                  }
                />
              ))}
            </motion.svg>
          )}
        </AnimatePresence>

        {/* ニュースバブル */}
        <div className="absolute inset-0">
          <AnimatePresence>
            {newsVisible &&
              bubbles.map((item) => (
                <NewsBubble
                  key={item.id}
                  item={item}
                  onClick={handleBubbleClick}
                  centerX={centerX}
                  centerY={centerY}
                  reducedMotion={prefersReducedMotion}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* 時計帯: 画面幅いっぱいの半透明の白い横帯 + 黒の太字デジタル時計 */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-40 -translate-y-1/2">
          <div className="flex w-full justify-center bg-white/70 py-3 backdrop-blur-[2px] sm:py-4">
            <DigitalClock className="text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl" />
          </div>
        </div>

        {/* 読み込み表示：クリックしたのにバブルがまだ無いときだけ出す。
            初回アクセスや再起動直後はRSS取得＋翻訳で数十秒かかることがあり、
            何も出ないと「反応していない」ように見えるため。 */}
        <AnimatePresence>
          {newsVisible && bubbles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute left-0 right-0 top-[calc(50%+3.5rem)] z-40 flex justify-center sm:top-[calc(50%+5rem)] lg:top-[calc(50%+6.5rem)]"
              aria-live="polite"
            >
              <span className="animate-pulse text-xs font-medium tracking-widest text-neutral-400 sm:text-sm">
                ニュースを読み込み中
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 詳細パネル */}
        <DetailPanel
          selected={selected}
          onClose={() => dispatch({ type: "DESELECT" })}
          reducedMotion={prefersReducedMotion}
        />
      </main>

      {/* キーボードヒント（フォーカス時のみ） */}
      <div className="sr-only" aria-live="polite">
        {selected ? `${selected.city}のニュースを表示中。Escapeで閉じる。` : ""}
      </div>
    </div>
  );
}
