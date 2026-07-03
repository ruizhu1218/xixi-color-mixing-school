import React, { useRef, useEffect, useCallback } from "react";
import { PaintBall } from "../types";
import mixbox from "mixbox";

interface PaintCanvasProps {
  balls: PaintBall[];
  setBalls: React.Dispatch<React.SetStateAction<PaintBall[]>>;
  onRemoveBall: (id: string) => void;
  maxBalls: number;
}

// 预计算背景色
const BG_R = 253;
const BG_G = 251;
const BG_B = 245;

// 把渲染逻辑抽成独立函数，用 ref 数据而非 state，避免 React 重渲染开销
function renderCanvas(
  canvas: HTMLCanvasElement,
  balls: PaintBall[],
  width: number,
  height: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // 300x300 离屏画布做像素级混色
  const offscreen = document.createElement("canvas");
  offscreen.width = 300;
  offscreen.height = 300;
  const oCtx = offscreen.getContext("2d");
  if (!oCtx) return;

  const imgData = oCtx.createImageData(300, 300);
  const data = imgData.data;

  const ballCount = balls.length;

  if (ballCount > 0) {
    // 预计算每个球的渲染数据
    const ballData = balls.map((b) => ({
      x: b.x,
      y: b.y,
      rSq: b.r * b.r,
      latent: mixbox.rgbToLatent(b.color.rgb),
    }));

    const mixCache = new Map<number, [number, number, number]>();

    for (let y = 0; y < 300; y++) {
      const idxY = y * 300;
      for (let x = 0; x < 300; x++) {
        let bitmask = 0;
        for (let k = 0; k < ballCount; k++) {
          const b = ballData[k];
          const dx = x - b.x;
          const dy = y - b.y;
          if (dx * dx + dy * dy <= b.rSq) {
            bitmask |= 1 << k;
          }
        }

        let r = BG_R;
        let g = BG_G;
        let bVal = BG_B;

        if (bitmask !== 0) {
          let cached = mixCache.get(bitmask);
          if (!cached) {
            const zMix = new Array(mixbox.LATENT_SIZE).fill(0);
            let totalWeight = 0;
            for (let k = 0; k < ballCount; k++) {
              if ((bitmask & (1 << k)) !== 0) {
                totalWeight += ballData[k].rSq;
              }
            }
            for (let k = 0; k < ballCount; k++) {
              if ((bitmask & (1 << k)) !== 0) {
                const bd = ballData[k];
                const normWeight = bd.rSq / totalWeight;
                for (let i = 0; i < mixbox.LATENT_SIZE; i++) {
                  zMix[i] += normWeight * bd.latent[i];
                }
              }
            }
            cached = mixbox.latentToRgb(zMix);
            mixCache.set(bitmask, cached);
          }
          r = cached[0];
          g = cached[1];
          bVal = cached[2];
        }

        const pixelIdx = (idxY + x) * 4;
        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = bVal;
        data[pixelIdx + 3] = 255;
      }
    }

    oCtx.putImageData(imgData, 0, 0);
  } else {
    // 没有球时填充纯色背景
    for (let i = 0; i < 300 * 300; i++) {
      const pi = i * 4;
      data[pi] = BG_R;
      data[pi + 1] = BG_G;
      data[pi + 2] = BG_B;
      data[pi + 3] = 255;
    }
    oCtx.putImageData(imgData, 0, 0);
  }

  // 绘制离屏画布到主画布
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(offscreen, 0, 0, 300, 300, 0, 0, width, height);

  const S = width / 300;

  if (ballCount === 0) {
    // 引导文字
    ctx.fillStyle = "#8C6A5C";
    ctx.font = "bold 15px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("从下方颜料盘点击添加颜料球", width / 2, height / 2 - 24);
    ctx.fillText("拖动圆球重叠来混色", width / 2, height / 2 + 2);
    ctx.fillText("双击圆球可以将其移除", width / 2, height / 2 + 28);
  } else {
    // 绘制每个球的轮廓、标签
    balls.forEach((b) => {
      const rx = b.x * S;
      const ry = b.y * S;
      const rr = b.r * S;

      // 虚线轮廓
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 外层加深描边
      ctx.beginPath();
      ctx.arc(rx, ry, rr + 1.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(30, 30, 30, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 颜色名标签
      const labelText = b.color.name;
      ctx.font = "bold 11px 'DM Sans', sans-serif";
      const textWidth = ctx.measureText(labelText).width;
      const padX = 7;
      const rectW = textWidth + padX * 2;
      const rectH = 18;
      const drawY = ry - rr < 25 ? ry + rr + 15 : ry - rr - 12;

      ctx.beginPath();
      ctx.roundRect(rx - rectW / 2, drawY - rectH / 2, rectW, rectH, 9);
      ctx.fillStyle = "#1E1E1E";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, rx, drawY);
    });
  }
}

export default function PaintCanvas({
  balls,
  setBalls,
  onRemoveBall,
  maxBalls,
}: PaintCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // === 拖动期间用 ref 存位置，绕过 React state 更新 ===
  const ballsRef = useRef<PaintBall[]>(balls);
  const draggedBallIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; ballId: string | null }>({
    time: 0,
    ballId: null,
  });
  const rafRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 300, height: 300 });

  // 同步 React state → ref
  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  // 重绘函数：用 ref 中的球数据直接绘制（不依赖 React state）
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = dimensionsRef.current;
    renderCanvas(canvas, ballsRef.current, width, height);
  }, []);

  // 尺寸变化 / 非拖动的 state 变化 → 重绘
  useEffect(() => {
    // 如果正在拖动中，不响应 state 变化（拖动由 rAF 自己画）
    if (draggedBallIdRef.current) return;
    draw();
  }, [balls, draw]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      dimensionsRef.current = { width, height: width };
      // 非拖动时直接重绘
      if (!draggedBallIdRef.current) {
        draw();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // 拖动结束时的 rAF 绘制循环
  const scheduleDragDraw = useCallback(() => {
    if (rafRef.current !== null) return; // 已有待执行的帧
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  // === 交互事件 ===

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 300 / rect.width;
    const lx = (e.clientX - rect.left) * scale;
    const ly = (e.clientY - rect.top) * scale;
    const now = Date.now();

    // 从上层往下找被点击的球
    const currentBalls = ballsRef.current;
    let clickedIndex = -1;
    for (let i = currentBalls.length - 1; i >= 0; i--) {
      const b = currentBalls[i];
      const dx = lx - b.x;
      const dy = ly - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        clickedIndex = i;
        break;
      }
    }

    if (clickedIndex !== -1) {
      const selectedBall = currentBalls[clickedIndex];

      // 双击检测
      const isDoubleTap =
        now - lastTapRef.current.time < 300 &&
        lastTapRef.current.ballId === selectedBall.id;

      if (isDoubleTap) {
        onRemoveBall(selectedBall.id);
        draggedBallIdRef.current = null;
        lastTapRef.current = { time: 0, ballId: null };
        return;
      }

      lastTapRef.current = { time: now, ballId: selectedBall.id };

      // 开始拖动：把被点击的球移到顶层
      draggedBallIdRef.current = selectedBall.id;
      dragOffsetRef.current = {
        x: lx - selectedBall.x,
        y: ly - selectedBall.y,
      };

      const reordered = [...currentBalls];
      reordered.splice(clickedIndex, 1);
      reordered.push(selectedBall);
      ballsRef.current = reordered;

      // 直接绘制，不走 React state
      draw();

      e.currentTarget.setPointerCapture(e.pointerId);
    } else {
      lastTapRef.current = { time: now, ballId: null };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggedBallIdRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 300 / rect.width;
    const lx = (e.clientX - rect.left) * scale;
    const ly = (e.clientY - rect.top) * scale;

    const targetX = lx - dragOffsetRef.current.x;
    const targetY = ly - dragOffsetRef.current.y;
    const clampedX = Math.max(0, Math.min(300, targetX));
    const clampedY = Math.max(0, Math.min(300, targetY));

    // 直接更新 ref，不触发 React 重渲染
    const dragId = draggedBallIdRef.current;
    ballsRef.current = ballsRef.current.map((b) =>
      b.id === dragId ? { ...b, x: clampedX, y: clampedY } : b
    );

    // 用 rAF 节流绘制
    scheduleDragDraw();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggedBallIdRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);

      // 拖动结束，一次性提交最终位置到 React state
      setBalls(ballsRef.current);

      draggedBallIdRef.current = null;
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      id="paint-canvas-container"
      ref={containerRef}
      className="relative w-full h-full bg-[#FFFBF5] rounded-2xl border-4 border-[#1E1E1E] shadow-[6px_6px_0px_0px_#1E1E1E] overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Memphis 几何装饰 */}
      <div className="absolute top-2 left-3 w-4 h-4 rounded-full border border-[#1E1E1E] opacity-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-[#1E1E1E] rotate-12 opacity-10 pointer-events-none" />
      <div className="absolute top-24 right-3 w-3 h-3 bg-[#1E1E1E] rotate-45 opacity-5 pointer-events-none" />

      <canvas
        id="paint-drawing-stage"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full touch-none"
      />

      {/* 球数指示器 */}
      <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-[#1E1E1E] text-white text-[10px] font-mono border border-white/20 select-none pointer-events-none">
        {balls.length}/{maxBalls} 个球
      </div>
    </div>
  );
}
