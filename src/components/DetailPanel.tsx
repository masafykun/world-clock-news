"use client";

import { AnimatePresence, motion } from "framer-motion";
import { InlineIcon } from "./InlineIcon";
import { localTime } from "@/hooks/useClock";
import type { BubbleItem } from "@/lib/bubbleLayout";

interface DetailPanelProps {
  selected: BubbleItem | null;
  onClose: () => void;
  reducedMotion: boolean;
}

export function DetailPanel({ selected, onClose, reducedMotion }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          key={selected.id}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 60 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.32, type: "spring", stiffness: 120, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[80] mx-auto w-full rounded-t-3xl bg-white/95 p-4 shadow-2xl shadow-pink-100 ring-1 ring-pink-200 backdrop-blur sm:bottom-6 sm:max-w-[620px] sm:rounded-3xl sm:p-5"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.city}のニュース詳細`}
        >
          <div className="flex gap-4">
            {/* アイコン */}
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-pink-50 text-4xl ring-1 ring-pink-200 sm:h-24 sm:w-24 sm:text-5xl"
              aria-hidden="true"
            >
              {selected.glyph}
            </div>

            {/* 本文 */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-pink-600">
                <InlineIcon name="clock" className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {selected.country} / {selected.city} /{" "}
                  {localTime(selected.timeZone)}
                </span>
              </div>
              <h2 className="text-base font-black leading-tight text-black sm:text-lg">
                {selected.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {selected.summary}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                  {selected.category}
                </span>
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InlineIcon name="external" className="h-3 w-3" />
                    記事を開く
                  </a>
                )}
              </div>
            </div>

            {/* 閉じるボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="self-start rounded-full p-2 text-neutral-400 hover:bg-pink-50 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              aria-label="詳細を閉じる"
            >
              <InlineIcon name="x" className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
