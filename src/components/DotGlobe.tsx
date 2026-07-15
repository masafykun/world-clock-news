"use client";

import { useEffect, useMemo, useRef } from "react";
// 陸地ドット座標は scripts/generate-land-dots.mjs が world-atlas の
// land-110m から事前生成した [lon*10, lat*10, ...] のフラット配列。
// 実行時に geoContains でサンプリングすると初期化が約2秒かかり
// ハイドレーションをブロックするため、ビルド時生成して同梱している。
import landDotsFlat from "@/lib/landDots.json";

const DOT_COLOR = "#EC4899";
// 裏半球は淡いラベンダーピンク。表のマゼンタの下に大陸が透けて見える
// 奥行き表現（参考: nwtgck/react-summer-wars-world-clock, ISC）
const BACK_DOT_COLOR = "#EDE9F1";
const ROTATION_MS = 180_000; // 360°/180秒。映画のゆったりした自転に合わせる
const TILT_RAD = 23.4 * (Math.PI / 180); // 実際の地軸傾斜角
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

      // 地軸の傾きは地球儀の中心を軸に Canvas ごと回す（時計や帯は対象外）
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT_RAD);

      // 裏半球を淡色で先に描き、その上に表半球を重ねて奥行きを出す
      ctx.fillStyle = BACK_DOT_COLOR;
      for (const d of dots) {
        const sinRel = d.sinLon * cosT + d.cosLon * sinT;
        const cosRel = d.cosLon * cosT - d.sinLon * sinT;
        const depth = d.cosLat * cosRel; // 視線方向成分。負なら裏半球
        if (depth > 0) continue;
        const x = radius * d.cosLat * sinRel;
        const y = -radius * d.sinLat;
        // 裏側は表より小径にして主張を抑える
        const r = baseR * (0.35 + 0.3 * -depth);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = DOT_COLOR;
      for (const d of dots) {
        const sinRel = d.sinLon * cosT + d.cosLon * sinT;
        const cosRel = d.cosLon * cosT - d.sinLon * sinT;
        const depth = d.cosLat * cosRel;
        if (depth <= 0) continue;
        const x = radius * d.cosLat * sinRel;
        const y = -radius * d.sinLat;
        // 深度でドット径を微変調して立体感を出す
        const r = baseR * (0.55 + 0.45 * depth);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
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
