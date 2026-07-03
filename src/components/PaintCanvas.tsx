import React, { useRef, useEffect, useState } from "react";
import { PaintBall } from "../types";
import mixbox from "mixbox";

interface PaintCanvasProps {
  balls: PaintBall[];
  setBalls: React.Dispatch<React.SetStateAction<PaintBall[]>>;
  onRemoveBall: (id: string) => void;
  maxBalls: number;
}

export default function PaintCanvas({
  balls,
  setBalls,
  onRemoveBall,
  maxBalls,
}: PaintCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  // Drag tracking refs
  const draggedBallIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; ballId: string | null }>({
    time: 0,
    ballId: null,
  });

  // Setup ResizeObserver to listen for container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep it square
      setDimensions({ width, height: width });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Rendering loop triggered when dimensions or balls change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Set high-DPI canvas resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Reset transform, then scale for DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Create a 300x300 offscreen canvas for fast pixel mixing
    const offscreen = document.createElement("canvas");
    offscreen.width = 300;
    offscreen.height = 300;
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return;

    const imgData = oCtx.createImageData(300, 300);
    const data = imgData.data;

    const ballsCount = balls.length;
    const ballData = balls.map((b) => ({
      x: b.x,
      y: b.y,
      r: b.r,
      rSq: b.r * b.r,
      rgb: b.color.rgb,
      latent: mixbox.rgbToLatent(b.color.rgb),
    }));

    // Cache to prevent repetitive mixbox calculations inside the pixel loop
    const mixCache = new Map<number, [number, number, number]>();

    // Canvas background: warm sand / milk-white #FFFBF5 [253, 251, 245]
    const bgR = 253;
    const bgG = 251;
    const bgB = 245;

    for (let y = 0; y < 300; y++) {
      const idxY = y * 300;
      for (let x = 0; x < 300; x++) {
        let bitmask = 0;
        for (let k = 0; k < ballsCount; k++) {
          const b = ballData[k];
          const dx = x - b.x;
          const dy = y - b.y;
          if (dx * dx + dy * dy <= b.rSq) {
            bitmask |= 1 << k;
          }
        }

        let r = bgR;
        let g = bgG;
        let b = bgB;

        if (bitmask !== 0) {
          let cached = mixCache.get(bitmask);
          if (!cached) {
            // Mix overlapping paints using mixbox area-weighted interpolation in latent space
            const zMix = new Array(mixbox.LATENT_SIZE).fill(0);
            let totalWeight = 0;
            for (let k = 0; k < ballsCount; k++) {
              if ((bitmask & (1 << k)) !== 0) {
                totalWeight += ballData[k].rSq;
              }
            }
            for (let k = 0; k < ballsCount; k++) {
              if ((bitmask & (1 << k)) !== 0) {
                const b = ballData[k];
                const normWeight = b.rSq / totalWeight;
                for (let i = 0; i < mixbox.LATENT_SIZE; i++) {
                  zMix[i] += normWeight * b.latent[i];
                }
              }
            }
            cached = mixbox.latentToRgb(zMix);
            mixCache.set(bitmask, cached);
          }
          r = cached[0];
          g = cached[1];
          b = cached[2];
        }

        const pixelIdx = (idxY + x) * 4;
        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        data[pixelIdx + 3] = 255;
      }
    }

    oCtx.putImageData(imgData, 0, 0);

    // Render offscreen canvas onto primary scaled canvas
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(offscreen, 0, 0, 300, 300, 0, 0, width, height);

    const S = width / 300;

    if (ballsCount === 0) {
      // Guide Text (Memphis Retro Style)
      ctx.fillStyle = "#8C6A5C";
      ctx.font = "bold 15px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("从下方颜料盘点击添加颜料球", width / 2, height / 2 - 24);
      ctx.fillText("拖动圆球重叠来混色", width / 2, height / 2 + 2);
      ctx.fillText("双击圆球可以将其移除", width / 2, height / 2 + 28);
    } else {
      // Draw ball outlines, handles, and labels
      balls.forEach((b) => {
        const rx = b.x * S;
        const ry = b.y * S;
        const rr = b.r * S;

        // 1. Dash boundary representing original circular reach
        ctx.beginPath();
        ctx.arc(rx, ry, rr, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Double stroke outline for maximum visibility
        ctx.beginPath();
        ctx.arc(rx, ry, rr + 1.5, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(30, 30, 30, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Color Name tag capsule above center (or below if too close to top)
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
  }, [dimensions, balls]);

  // Pointer interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Translate client coordinates to logical 300x300 canvas coordinates
    const scale = 300 / rect.width;
    const lx = clientX * scale;
    const ly = clientY * scale;

    const now = Date.now();

    // Find the clicked ball from top to bottom
    let clickedIndex = -1;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const dx = lx - b.x;
      const dy = ly - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        clickedIndex = i;
        break;
      }
    }

    if (clickedIndex !== -1) {
      const selectedBall = balls[clickedIndex];

      // Custom double-tap/double-click detector
      const isDoubleTap =
        now - lastTapRef.current.time < 300 &&
        lastTapRef.current.ballId === selectedBall.id;

      if (isDoubleTap) {
        onRemoveBall(selectedBall.id);
        draggedBallIdRef.current = null;
        lastTapRef.current = { time: 0, ballId: null };
        return;
      }

      // Record tap for future double-tap checks
      lastTapRef.current = { time: now, ballId: selectedBall.id };

      // Initialize dragging
      draggedBallIdRef.current = selectedBall.id;
      dragOffsetRef.current = {
        x: lx - selectedBall.x,
        y: ly - selectedBall.y,
      };

      // Re-order the balls array to make the clicked ball active on top
      const reordered = [...balls];
      const [dragged] = reordered.splice(clickedIndex, 1);
      reordered.push(dragged);
      setBalls(reordered);

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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scale = 300 / rect.width;
    const lx = clientX * scale;
    const ly = clientY * scale;

    const targetX = lx - dragOffsetRef.current.x;
    const targetY = ly - dragOffsetRef.current.y;

    // Bound coordinates to logical 300x300 space (clamped centers)
    const clampedX = Math.max(0, Math.min(300, targetX));
    const clampedY = Math.max(0, Math.min(300, targetY));

    setBalls((prev) =>
      prev.map((b) =>
        b.id === draggedBallIdRef.current
          ? { ...b, x: clampedX, y: clampedY }
          : b
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggedBallIdRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggedBallIdRef.current = null;
    }
  };

  return (
    <div
      id="paint-canvas-container"
      ref={containerRef}
      className="relative w-full aspect-square bg-[#FFFBF5] rounded-2xl border-4 border-[#1E1E1E] shadow-[6px_6px_0px_0px_#1E1E1E] overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Absolute background patterns (Memphis geometric subtle decals) */}
      <div className="absolute top-2 left-3 w-4 h-4 rounded-full border border-[#1E1E1E] opacity-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-[#1E1E1E] rotate-12 opacity-10 pointer-events-none" />
      <div className="absolute top-24 right-3 w-3 h-3 bg-[#1E1E1E] rotate-45 opacity-5 pointer-events-none" />

      <canvas
        id="paint-drawing-stage"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="block w-full h-full"
      />

      {/* Balls counter indicator in the corner */}
      <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-[#1E1E1E] text-white text-[10px] font-mono border border-white/20 select-none pointer-events-none">
        {balls.length}/{maxBalls} 个球
      </div>
    </div>
  );
}
