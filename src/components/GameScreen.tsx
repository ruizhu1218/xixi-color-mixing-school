import React, { useState, useEffect } from "react";
import { ArrowLeft, Lightbulb, Trash2, Check, Star, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Level, PaintBall, PaintColor, LevelProgress } from "../types";
import {
  BASE_COLORS,
  BASE_COLORS_MAP,
  getRecipeColor,
  getRecipeHint,
  mixColors,
  calculateSimilarity,
  getStarsForScore,
  LEVELS,
} from "../data";
import PaintCanvas from "./PaintCanvas";

interface GameScreenProps {
  level: Level;
  onBack: () => void;
  onLevelComplete: (levelId: number, stars: number) => void;
  onNextLevel: () => void;
  progress: LevelProgress[];

  // Survival Mode Props
  isSurvival?: boolean;
  survivalLives?: number;
  survivalScore?: number;
  survivalHighScore?: number;
  onSurvivalMix?: (score: number, passed: boolean) => void;
  onSurvivalNext?: () => void;
  onSurvivalReset?: () => void;
}

export default function GameScreen({
  level,
  onBack,
  onLevelComplete,
  onNextLevel,
  progress,
  isSurvival = false,
  survivalLives = 3,
  survivalScore = 0,
  survivalHighScore = 0,
  onSurvivalMix,
  onSurvivalNext,
  onSurvivalReset,
}: GameScreenProps) {
  // State for paint balls in the current session
  const [balls, setBalls] = useState<PaintBall[]>([]);

  // UI state
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentStars, setCurrentStars] = useState<number>(0);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Target color derived from the level recipe
  const { rgb: targetRgb, hex: targetHex } = getRecipeColor(level.recipe);

  // Auto-hide warning message after 2.5s
  useEffect(() => {
    if (warningMsg) {
      const t = setTimeout(() => setWarningMsg(null), 2500);
      return () => clearTimeout(t);
    }
  }, [warningMsg]);

  // Clean state when moving to a new level
  useEffect(() => {
    setBalls([]);
    setShowHint(false);
    setShowResults(false);
    setCurrentScore(0);
    setCurrentStars(0);
    setWarningMsg(null);
  }, [level]);

  // Handle adding paint color from palette
  const handleAddPaint = (color: PaintColor) => {
    if (balls.length >= level.maxBalls) {
      setWarningMsg(`画布最多只能添加 ${level.maxBalls} 个颜料圆球哦！`);
      return;
    }

    // Spawn ball near the logical 150,150 center with slight random offset
    const randomOffsetRange = 40;
    const spawnX = 150 + (Math.random() * randomOffsetRange - randomOffsetRange / 2);
    const spawnY = 150 + (Math.random() * randomOffsetRange - randomOffsetRange / 2);

    const newBall: PaintBall = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      colorId: color.id,
      color,
      x: spawnX,
      y: spawnY,
      r: 50, // standard radius of 50 as requested
    };

    setBalls((prev) => [...prev, newBall]);
    setShowResults(false); // Hide stale results
  };

  // Handle removing a paint ball
  const handleRemoveBall = (id: string) => {
    setBalls((prev) => prev.filter((b) => b.id !== id));
    setShowResults(false); // Hide stale results
  };

  // Perform mixing check
  const handleVerify = () => {
    if (balls.length === 0) {
      setWarningMsg("请先在基础颜料盘添加颜料圆球来进行混合！");
      return;
    }

    // Blend all active balls
    const items = balls.map((b) => ({
      color: b.color,
      weight: b.r * b.r, // physical area weight
    }));

    const blendedRgb = mixColors(items);
    const score = calculateSimilarity(blendedRgb, targetRgb);

    if (isSurvival) {
      const passed = score >= 80;
      setCurrentScore(score);
      setShowResults(true);
      if (onSurvivalMix) {
        onSurvivalMix(score, passed);
      }
    } else {
      const stars = getStarsForScore(score);
      setCurrentScore(score);
      setCurrentStars(stars);
      setShowResults(true);

      if (stars >= 1) {
        // Trigger callback to update parent level progress state
        onLevelComplete(level.id, stars);
      }
    }
  };

  // Count active balls of each color
  const colorCounts = balls.reduce((acc, b) => {
    acc[b.colorId] = (acc[b.colorId] || 0) + 1;
    return acc;
  }, {} as { [id: string]: number });

  // Filter BASE_COLORS to current level's allowed colors
  const allowedPaints = BASE_COLORS.filter((c) =>
    level.allowedColors.includes(c.id)
  );

  return (
    <div id="game-screen-root" className="flex flex-col h-full select-none relative bg-[#FDF6EC]">
      {/* 1. TOP NAVBAR */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b-3 border-[#1E1E1E] z-10 gap-2">
        <button
          onClick={onBack}
          className="cursor-pointer p-1.5 rounded-xl border-2 border-[#1E1E1E] bg-[#FFFBF5] hover:bg-[#F3EDE2] active:scale-95 transition-all shadow-[2px_2px_0px_0px_#1E1E1E]"
        >
          <ArrowLeft className="w-5 h-5 text-[#1E1E1E]" />
        </button>

        <span className="font-display font-bold text-base sm:text-lg text-[#1E1E1E] truncate max-w-[150px] sm:max-w-none">
          {isSurvival ? `🎲 生存挑战 第 ${survivalScore + 1} 关` : `第 ${level.id} 关：${level.name}`}
        </span>

        {isSurvival ? (
          <div className="flex gap-1 items-center bg-[#FFEBEB] border-2 border-[#8C2D2A]/30 px-2.5 py-1 rounded-xl text-xs font-black text-[#8C2D2A] shrink-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="text-xs sm:text-sm">
                {i < survivalLives ? "❤️" : "🖤"}
              </span>
            ))}
            <span className="ml-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wide">得分: {survivalScore}</span>
          </div>
        ) : (
          /* Level Progress Tracker Dots filtered by current difficulty */
          <div className="flex gap-1 items-center max-w-[120px] overflow-x-auto no-scrollbar shrink-0">
            {LEVELS.filter((l) => l.difficulty === level.difficulty).map((lvl) => {
              const isCurrent = lvl.id === level.id;
              const levelProg = progress.find((p) => p.levelId === lvl.id);
              const isDone = levelProg && levelProg.stars > 0;

              return (
                <div
                  key={lvl.id}
                  className={`w-1.5 h-1.5 shrink-0 rounded-full transition-all ${
                    isCurrent
                      ? "bg-[#E63329] ring-1 ring-[#1E1E1E] scale-125"
                      : isDone
                      ? "bg-[#0B8A3C]"
                      : "bg-gray-300"
                  }`}
                  title={`第 ${lvl.id} 关：${lvl.name}`}
                />
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content scrollable view */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-w-md mx-auto w-full no-scrollbar pb-28">
        {/* 2. TARGET COLOR SPEC CARD */}
        <div className="bg-white rounded-2xl border-3 border-[#1E1E1E] p-3 shadow-[4px_4px_0px_0px_#1E1E1E] flex items-center gap-4">
          {/* Target Orb (Physical Paint styled sphere) */}
          <div className="relative w-18 h-18 rounded-full flex-shrink-0 border-3 border-[#1E1E1E]">
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: targetHex,
              }}
            />
            {/* Small Sparkle visual badge */}
            <div className="absolute -top-1 -right-1 bg-[#FCE300] border-2 border-[#1E1E1E] rounded-full p-0.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#1E1E1E]" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A3412] bg-[#FFedd5] px-1.5 py-0.5 rounded-md border border-[#9A3412]/20">
                目标色 Target
              </span>
            </div>
            <h2 className="text-base font-bold text-[#1E1E1E]">{level.name}</h2>
            <p className="text-[11px] text-[#6B5A4E] leading-snug mt-0.5">
              {level.description}
            </p>
          </div>
        </div>

        {/* 3. DYNAMIC CANVAS WORKSPACE */}
        <PaintCanvas
          balls={balls}
          setBalls={setBalls}
          onRemoveBall={handleRemoveBall}
          maxBalls={level.maxBalls}
        />

        {/* 4. BASIC PALETTE CARD (Placed directly under PaintCanvas and scrolls with it) */}
        <div className="bg-white rounded-2xl border-3 border-[#1E1E1E] p-3.5 shadow-[4px_4px_0px_0px_#1E1E1E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1E1E1E] flex items-center gap-1">
              🎨 基础颜料盘 <span className="text-[10px] font-medium text-gray-500">(点击添加，最多 {level.maxBalls} 个球)</span>
            </span>
          </div>

          {/* Horizontal scroll of paint color swatches */}
          <div
            id="paint-palette-scroll"
            className="flex gap-4 overflow-x-auto py-1 px-0.5 scrollbar-none no-scrollbar"
          >
            {allowedPaints.map((color) => {
              const count = colorCounts[color.id] || 0;
              const hasAdded = count > 0;

              return (
                <button
                  key={color.id}
                  onClick={() => handleAddPaint(color)}
                  className="cursor-pointer flex flex-col items-center flex-shrink-0 focus:outline-none relative group"
                  style={{ minWidth: "56px" }}
                >
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      hasAdded
                        ? "scale-105 border-4 border-[#0B8A3C]"
                        : "border-2 border-[#1E1E1E] hover:scale-102 active:scale-98"
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />

                    {/* Paint Ball Counter Badge */}
                    {hasAdded && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0B8A3C] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                        {count}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold font-sans text-[#1E1E1E] mt-1 line-clamp-1 max-w-[56px]">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. FIXED STICKY CONTROL BOTTOM BAR */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 border-t-3 border-[#1E1E1E] bg-white z-30 shadow-[0_-8px_20px_rgba(30,30,30,0.08)] flex flex-col gap-3">
        {/* WARNING ALERT NOTIFICATION */}
        <AnimatePresence>
          {warningMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[#FFEBEB] text-[#8C2D2A] text-xs font-bold py-2 px-3 rounded-xl border-2 border-[#8C2D2A]/30 text-center shadow-sm"
            >
              ⚠️ {warningMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. RECIPE HINT BANNER */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 8, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: 8, scaleY: 0.9 }}
              className="bg-[#FFFDE0] rounded-xl border-2 border-dashed border-[#BCA86F] p-3 text-center shadow-sm relative overflow-hidden"
            >
              {/* Post-it visual pins */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-red-400/40" />

              <span className="text-[9px] uppercase font-bold text-[#8C7D54] tracking-wider block mb-1">
                🎨 参考配方 Reference Formula
              </span>
              <p className="text-sm font-sans font-bold text-[#6D5D30]">
                {getRecipeHint(level.recipe)}
              </p>
              <p className="text-[10px] text-[#8C7D54]/80 mt-1 leading-snug">
                拖动带有该配方数量的颜料球在画布里，使它们尽量重叠融合吧。
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. VERIFICATION / RESULT POPUP */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-[#FFFBF5] rounded-2xl border-3 border-[#1E1E1E] shadow-[4px_4px_0px_0px_#1E1E1E] overflow-hidden"
            >
              <div className="p-4 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-3">
                  {/* Visual side-by-side comparison */}
                  <div className="flex items-center -space-x-4">
                    {/* Blended Color Sphere */}
                    <div className="relative w-12 h-12 rounded-full border-2 border-[#1E1E1E] z-10">
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: rgbToHexStr(
                            mixColors(
                              balls.map((b) => ({
                                color: b.color,
                                weight: b.r * b.r,
                              }))
                            )
                          ),
                        }}
                      />
                      <span className="absolute -bottom-1 -left-1 text-[8px] bg-[#1E1E1E] text-white px-1 py-0.2 rounded font-sans scale-90">
                        你调的
                      </span>
                    </div>

                    {/* Target Sphere */}
                    <div className="relative w-12 h-12 rounded-full border-2 border-[#1E1E1E] z-0 opacity-80">
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: targetHex,
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 text-[8px] bg-emerald-700 text-white px-1 py-0.2 rounded font-sans scale-90">
                        目标
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-[11px] font-sans font-bold text-gray-500">
                      色彩相似度 Matching Rate
                    </div>
                    <div className="text-2xl font-display font-extrabold text-[#1E1E1E]">
                      {currentScore}%
                    </div>
                  </div>
                </div>

                {isSurvival ? (
                  /* Survival Mode Results layout */
                  <div className="space-y-3 w-full">
                    {currentScore >= 80 ? (
                      <>
                        <p className="text-xs text-[#0B8A3C] font-bold">
                          🎉 挑战成功！物理相似度 {currentScore}%！
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          得分 +1 🌟 | 生命值 +1 ❤️ (上限 3)
                        </p>
                        <div className="flex gap-2.5 w-full">
                          <button
                            onClick={onBack}
                            className="cursor-pointer flex-1 py-2 px-3 bg-white hover:bg-gray-50 text-[#1E1E1E] text-xs font-bold rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            回到列表
                          </button>
                          <button
                            onClick={onSurvivalNext}
                            className="cursor-pointer flex-[1.4] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0B8A3C] hover:bg-[#097332] text-white text-xs font-black rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            <span>挑战下一关</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : survivalLives > 0 ? (
                      <>
                        <p className="text-xs text-[#C0186A] font-bold">
                          💔 挑战未过关！物理相似度 {currentScore}% (通关要求 80%)
                        </p>
                        <p className="text-[10px] text-[#C0186A]/80 font-bold animate-pulse">
                          生命值 -1 🖤 (剩余 {survivalLives} 颗心)
                        </p>
                        <div className="flex gap-2.5 w-full">
                          <button
                            onClick={onBack}
                            className="cursor-pointer flex-1 py-2 px-3 bg-white hover:bg-gray-50 text-[#1E1E1E] text-xs font-bold rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            回到列表
                          </button>
                          <button
                            onClick={() => {
                              setBalls([]);
                              setShowResults(false);
                            }}
                            className="cursor-pointer flex-[1.4] py-2 px-3 bg-[#E63329] hover:bg-[#c9251c] text-white text-xs font-black rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            重试此关
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#E63329] font-black uppercase tracking-wider animate-bounce">
                          💀 GAME OVER 游戏结束！
                        </p>
                        <div className="bg-white p-2 border-2 border-[#1E1E1E] rounded-xl text-xs font-medium text-gray-700 flex justify-around w-full shadow-[2px_2px_0px_0px_#1E1E1E]">
                          <p>本次得分: <strong className="text-[#E63329]">{survivalScore}</strong></p>
                          <p>历史最高: <strong className="text-[#0B8A3C]">{survivalHighScore}</strong></p>
                        </div>
                        <div className="flex gap-2.5 w-full">
                          <button
                            onClick={onBack}
                            className="cursor-pointer flex-1 py-2 px-3 bg-white hover:bg-gray-50 text-[#1E1E1E] text-xs font-bold rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            回到列表
                          </button>
                          <button
                            onClick={onSurvivalReset}
                            className="cursor-pointer flex-[1.4] py-2 px-3 bg-[#1B4CA1] hover:bg-[#153B82] text-white text-xs font-black rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            重新开始挑战
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Campaign Mode Results Layout */
                  <div className="w-full space-y-3">
                    {/* Stars earned feedback */}
                    <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3].map((starIdx) => {
                        const isLit = starIdx <= currentStars;
                        return (
                          <Star
                            key={starIdx}
                            className={`w-6 h-6 ${
                              isLit
                                ? "fill-[#FCE300] text-[#1E1E1E] animate-bounce"
                                : "text-gray-300"
                            }`}
                            style={{
                              animationDelay: `${starIdx * 100}ms`,
                              animationDuration: "1s",
                            }}
                          />
                        );
                      })}
                    </div>

                    {currentStars >= 1 ? (
                      <div className="space-y-3 w-full">
                        <p className="text-xs text-[#0B8A3C] font-bold">
                          🎉 恭喜通关！完美表现！
                        </p>
                        {/* Double buttons in row layout */}
                        <div className="flex gap-2.5 w-full">
                          <button
                            onClick={onBack}
                            className="cursor-pointer flex-1 py-2 px-3 bg-white hover:bg-gray-50 text-[#1E1E1E] text-xs font-bold rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            回到列表
                          </button>
                          <button
                            onClick={onNextLevel}
                            className="cursor-pointer flex-[1.4] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F27D26] hover:bg-[#e06b18] text-white text-xs font-black rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            <span>下一关</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 w-full">
                        <p className="text-xs text-[#C0186A] font-bold">
                          💡 相似度不足 55%，加油再混合一下吧！
                        </p>
                        <p className="text-[10px] text-gray-500 leading-snug">
                          提示：检查颜料球的数量或比例。点击 💡 提示按钮获取参考配方。
                        </p>
                        <div className="flex gap-2.5 w-full pt-1">
                          <button
                            onClick={() => setShowResults(false)}
                            className="cursor-pointer flex-1 py-1.5 px-3 bg-white hover:bg-gray-50 text-[#1E1E1E] text-xs font-bold rounded-xl border-2 border-[#1E1E1E] shadow-[1px_1px_0px_0px_#1E1E1E] active:scale-[0.98] transition-all"
                          >
                            继续尝试
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-md mx-auto w-full grid grid-cols-3 gap-3">
          {/* Hint button */}
          <button
            disabled={isSurvival && survivalLives === 0}
            onClick={() => {
              setShowHint(!showHint);
              setShowResults(false);
            }}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border-2 border-[#1E1E1E] font-bold text-xs transition-all active:scale-95 shadow-[2px_2px_0px_0px_#1E1E1E] ${
              showHint
                ? "bg-[#FCE300] text-[#1E1E1E]"
                : "bg-white text-[#1E1E1E] hover:bg-[#FDFBF5]"
            } ${isSurvival && survivalLives === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Lightbulb className="w-4 h-4 text-orange-500" />
            <span>提示</span>
          </button>

          {/* Clear canvas button */}
          <button
            onClick={() => {
              setBalls([]);
              setShowResults(false);
            }}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border-2 border-[#1E1E1E] bg-white text-[#1E1E1E] hover:bg-[#FFF5F5] font-bold text-xs transition-all active:scale-95 shadow-[2px_2px_0px_0px_#1E1E1E]"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>清空</span>
          </button>

          {/* Verify results button */}
          <button
            disabled={isSurvival && survivalLives === 0}
            onClick={handleVerify}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white hover:bg-[#2D2D2D] font-bold text-xs transition-all active:scale-95 shadow-[2px_2px_0px_0px_#8C8C8C] ${isSurvival && survivalLives === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>检验</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// Inline helper to convert rgb tuple to rgb() hex string
function rgbToHexStr(rgb: [number, number, number]): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => {
    const h = clamp(c).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}
