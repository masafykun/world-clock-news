"use client";

import { useEffect, useMemo, useRef } from "react";
// 陸地ドット座標は scripts/generate-land-dots.mjs が world-atlas の
// land-110m から事前生成した [lon*10, lat*10, ...] のフラット配列。
// 実行時に geoContains でサンプリングすると初期化が約2秒かかり
// ハイドレーションをブロックするため、ビルド時生成して同梱している。
import landDotsFlat from "@/lib/landDots.json";

const DOT_COLOR = "#EC4899";
const ROTATION_MS = 60_000; // 360°/60秒でゆっくり自転
const DEG = Math.PI / 180;

interface LandDot {
  // 経度方向の回転だけで済むよう三角関数を事前計算しておく
  sinLon: number;
  cosLon: number;
  sinLat: number;
  cosLat: number;
}

function buildLandDots(): LandDot[] {
  const flat = landDotsFlat as number[];
  const dots: LandDot[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    const lon = (flat[i] / 10) * DEG;
    const lat = (flat[i + 1] / 10) * DEG;
    dots.push({
      sinLon: Math.sin(lon),
      cosLon: Math.cos(lon),
      sinLat: Math.sin(lat),
      cosLat: Math.cos(lat),
    });
  }
  return dots;
}

interface DotGlobeProps {
  className?: string;
}

export function DotGlobe({ className }: DotGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dots = useMemo(buildLandDots, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cssSize = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssSize = Math.min(rect.width, rect.height);
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    // 正射図法（geoOrthographic 相当）。回転は経度方向のみなので
    // 加法定理で回転後の経度の三角関数を求め、毎フレーム
    // 数千ドットでも軽く描画できるようにしている
    const draw = (rotationDeg: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const radius = (cssSize * dpr) / 2 - 4 * dpr;
      if (radius <= 0) return;

      const theta = rotationDeg * DEG;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const baseR = radius * 0.011;

      ctx.fillStyle = DOT_COLOR;
      for (const d of dots) {
        const sinRel = d.sinLon * cosT + d.cosLon * sinT;
        const cosRel = d.cosLon * cosT - d.sinLon * sinT;
        const depth = d.cosLat * cosRel; // 視線方向成分。負なら裏半球
        if (depth <= 0) continue;
        const x = cx + radius * d.cosLat * sinRel;
        const y = cy - radius * d.sinLat;
        // 深度でドット径を微変調して立体感を出す
        const r = baseR * (0.55 + 0.45 * depth);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();

    if (reducedMotion) {
      draw(0);
      const observer = new ResizeObserver(() => {
        resize();
        draw(0);
      });
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      draw((((t - start) % ROTATION_MS) / ROTATION_MS) * 360);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [dots]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="回転する地球儀"
      role="img"
    />
  );
}
