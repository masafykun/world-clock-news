"use client";

import { motion } from "framer-motion";
import type { BubbleItem } from "@/lib/bubbleLayout";

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
      className="absolute overflow-hidden rounded-full bg-white/90 shadow-md shadow-pink-100 ring-2 ring-pink-300/70 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-pink-400"
      style={{ width: item.size, height: item.size }}
      aria-label={`${item.city}のニュース: ${item.title}`}
    >
      {/* 絵文字 */}
      <div
        className="absolute inset-0 grid place-items-center text-2xl sm:text-3xl"
        aria-hidden="true"
      >
        {item.glyph}
      </div>

      {/* 都市名 */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink-500 px-2 py-0.5 text-[9px] font-bold text-white">
        {item.city}
      </div>
    </motion.button>
  );
}
