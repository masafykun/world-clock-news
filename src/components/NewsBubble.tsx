"use client";

import { motion } from "framer-motion";
import type { BubbleItem } from "@/lib/bubbleLayout";
import { categoryColors } from "@/lib/news/categoryMeta";

interface NewsBubbleProps {
  item: BubbleItem;
  centerX: number;
  centerY: number;
  onClick: (item: BubbleItem) => void;
  reducedMotion: boolean;
}

export function NewsBubble({
  item,
  centerX,
  centerY,
  onClick,
  reducedMotion,
}: NewsBubbleProps) {
  const color = categoryColors[item.category] ?? "bg-gray-200";
  const left = item.x - item.size / 2;
  const top = item.y - item.size / 2;

  return (
    <motion.button
      type="button"
      initial={
        reducedMotion
          ? { opacity: 1, scale: 1, x: left, y: top }
          : { opacity: 0, scale: 0.1, x: centerX, y: centerY }
      }
      animate={{ opacity: 1, scale: 1, x: left, y: top }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.1, x: centerX, y: centerY }
      }
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : {
              delay: item.delay,
              type: "spring",
              stiffness: 90,
              damping: 15,
            }
      }
      whileHover={reducedMotion ? {} : { scale: 1.12, zIndex: 50 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      className={`absolute overflow-hidden rounded-full ${color} bg-gradient-to-br ${item.gradient} shadow-lg ring-4 ring-white/80 focus:outline-none focus:ring-pink-400`}
      style={{ width: item.size, height: item.size }}
      aria-label={`${item.city}のニュース: ${item.title}`}
    >
      {/* 光沢 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0.18)_38%,rgba(255,255,255,0)_70%)]" />

      {/* 絵文字 */}
      <div
        className="absolute inset-0 grid place-items-center text-2xl sm:text-3xl"
        aria-hidden="true"
      >
        {item.glyph}
      </div>

      {/* ハイライト */}
      <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-white/85 shadow" />

      {/* 都市名 */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-bold text-slate-700 shadow-sm">
        {item.city}
      </div>
    </motion.button>
  );
}
