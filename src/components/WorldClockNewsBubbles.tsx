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
import { DotGlobe } from "./DotGlobe";
import { DigitalClock } from "./DigitalClock";
import { InlineIcon } from "./InlineIcon";
import { NewsBubble } from "./NewsBubble";
import { DetailPanel } from "./DetailPanel";

interface State {
  newsVisible: boolean;
  selected: BubbleItem | null;
}

type Action =
  | { type: "SHOW_NEWS" }
  | { type: "SELECT"; item: BubbleItem }
  | { type: "DESELECT" }
  | { type: "BACKGROUND_CLICK" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SHOW_NEWS":
      return { ...state, newsVisible: true };
    case "SELECT":
      return { ...state, selected: action.item };
    case "DESELECT":
      return { ...state, selected: null };
    case "BACKGROUND_CLICK":
      if (!state.newsVisible) return { ...state, newsVisible: true };
      if (state.selected) return { ...state, selected: null };
      return state;
    default:
      return state;
  }
}

export default function WorldClockNewsBubbles() {
  const now = useClock(1000);
  const { items, loading, error, source } = useNews();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const [{ newsVisible, selected }, dispatch] = useReducer(reducer, {
    newsVisible: false,
    selected: null,
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
  const bubbles = useMemo(
    () => buildBubbleLayout(rotated, width, height),
    [rotated, width, height]
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
      {/* ヘッダー */}
      <header className="pointer-events-none relative z-50 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-pink-500 text-white sm:h-11 sm:w-11">
            <InlineIcon name="globe" className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-black sm:text-xl">
              World Clock News
            </h1>
            <p className="text-xs text-neutral-400 sm:text-sm">
              {newsVisible
                ? "バブルをクリックすると詳細を表示"
                : "クリックして世界のニュースを見る"}
            </p>
          </div>
        </div>

        {/* ステータスバッジ */}
        <div className="pointer-events-auto flex items-center gap-2">
          {loading && (
            <span className="hidden rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 sm:inline-flex">
              取得中…
            </span>
          )}
          {error && (
            <span
              className="hidden rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 sm:inline-flex"
              title={error}
            >
              ⚠ サンプル表示中
            </span>
          )}
          {source === "api" && (
            <span className="hidden rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-600 sm:inline-flex">
              ● ライブ
            </span>
          )}
          {newsVisible && (
            <span className="hidden rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-neutral-200 backdrop-blur sm:inline-flex">
              {String(activeHour).padStart(2, "0")}:00 のニュース
            </span>
          )}
        </div>
      </header>

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
            className="h-[min(88vw,88svh,620px)] w-[min(88vw,88svh,620px)]"
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
        <div className="pointer-events-none absolute left-0 right-0 top-[38%] z-40 -translate-y-1/2">
          <div className="flex w-full justify-center bg-white/70 py-3 backdrop-blur-[2px] sm:py-4">
            <DigitalClock className="text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl" />
          </div>
        </div>

        {/* クリック促進（初期状態のみ） */}
        <AnimatePresence>
          {!newsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.6 }}
              className="pointer-events-none absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-pink-500 px-5 py-2 text-sm font-black text-white"
              aria-hidden="true"
            >
              <InlineIcon name="spark" className="h-4 w-4" />
              クリックして世界のニュースを見る
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
