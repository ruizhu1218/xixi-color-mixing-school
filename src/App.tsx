import React, { useState, useEffect } from "react";
import { ScreenType, Level, LevelProgress } from "./types";
import { LEVELS, getRecipeColor, generateRandomSurvivalLevel } from "./data";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";
import CompleteScreen from "./components/CompleteScreen";
import Confetti from "./components/Confetti";
import { motion, AnimatePresence } from "motion/react";
import { Palette, HelpCircle } from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState<ScreenType>("select");
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState<LevelProgress[]>([]);
  const [celebrationActive, setCelebrationActive] = useState<boolean>(false);

  // Survival Mode States
  const [isSurvivalMode, setIsSurvivalMode] = useState<boolean>(false);
  const [survivalScore, setSurvivalScore] = useState<number>(0);
  const [survivalLives, setSurvivalLives] = useState<number>(3);
  const [survivalHighScore, setSurvivalHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("color_mix_survival_highscore");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  // Load progress from localStorage on boot
  useEffect(() => {
    const saved = localStorage.getItem("color_mix_school_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProgress(parsed);
        }
      } catch (e) {
        console.error("Failed to parse progress from local storage:", e);
      }
    }
  }, []);

  // Handle level completion
  const handleLevelComplete = (levelId: number, stars: number) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.levelId === levelId);
      let updatedProgress;

      if (existing) {
        // Keep the highest star record
        if (stars > existing.stars) {
          updatedProgress = prev.map((p) =>
            p.levelId === levelId ? { ...p, stars } : p
          );
        } else {
          updatedProgress = prev;
        }
      } else {
        updatedProgress = [...prev, { levelId, stars, completed: true }];
      }

      localStorage.setItem(
        "color_mix_school_progress",
        JSON.stringify(updatedProgress)
      );
      return updatedProgress;
    });

    // Fire confetti celebration on successful verification!
    setCelebrationActive(true);
  };

  // Stop celebration after 5 seconds
  useEffect(() => {
    if (celebrationActive) {
      const timer = setTimeout(() => {
        setCelebrationActive(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [celebrationActive]);

  // Navigate back to selection or transition to complete screen if level 15 is done
  const handleBackToSelect = () => {
    setCelebrationActive(false);

    // If level 15 was completed with at least 1 star, show complete screen!
    const lvl15Prog = progress.find((p) => p.levelId === 15);
    const completedAll = lvl15Prog && lvl15Prog.stars >= 1;

    if (completedAll) {
      setScreen("complete");
    } else {
      setScreen("select");
    }
    setSelectedLevel(null);
  };

  const handleNextLevel = () => {
    setCelebrationActive(false);
    if (!selectedLevel) return;
    const nextId = selectedLevel.id + 1;
    const nextLvl = LEVELS.find((l) => l.id === nextId);
    if (nextLvl) {
      setSelectedLevel(nextLvl);
    } else {
      handleBackToSelect();
    }
  };

  const handleSelectLevel = (level: Level) => {
    setSelectedLevel(level);
    setScreen("game");
  };

  const handleResetProgress = () => {
    setProgress([]);
    localStorage.removeItem("color_mix_school_progress");
    setScreen("select");
    setSelectedLevel(null);
    setCelebrationActive(false);
  };

  const handleRestartCampaign = () => {
    setScreen("select");
    setSelectedLevel(null);
    setCelebrationActive(false);
  };

  const handleSelectSurvival = () => {
    setIsSurvivalMode(true);
    setSurvivalScore(0);
    setSurvivalLives(3);
    const randomLvl = generateRandomSurvivalLevel(0);
    setSelectedLevel(randomLvl);
    setScreen("game");
  };

  const handleSurvivalMix = (score: number, passed: boolean) => {
    if (passed) {
      const nextScore = survivalScore + 1;
      setSurvivalScore(nextScore);
      if (nextScore > survivalHighScore) {
        setSurvivalHighScore(nextScore);
        localStorage.setItem("color_mix_survival_highscore", String(nextScore));
      }
      setSurvivalLives((prev) => Math.min(3, prev + 1));
      setCelebrationActive(true);
    } else {
      setSurvivalLives((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSurvivalNext = () => {
    setCelebrationActive(false);
    const nextLvl = generateRandomSurvivalLevel(survivalScore);
    setSelectedLevel(nextLvl);
  };

  const handleSurvivalReset = () => {
    setCelebrationActive(false);
    setSurvivalScore(0);
    setSurvivalLives(3);
    const randomLvl = generateRandomSurvivalLevel(0);
    setSelectedLevel(randomLvl);
  };

  return (
    <div className="min-h-screen h-screen w-full bg-[#FDF6EC] text-[#1E1E1E] font-sans flex overflow-hidden relative select-none">
      {/* 1. Subtle, stylish Memphis Geometric Deco elements floating in background */}
      <div className="absolute top-10 left-[5%] w-16 h-16 rounded-full border-4 border-dotted border-[#E63329] opacity-5 pointer-events-none" />
      <div className="absolute top-1/4 right-[10%] w-24 h-12 bg-[#FBB040] opacity-5 pointer-events-none -rotate-12 rounded-xl" />
      <div className="absolute bottom-20 left-[12%] w-16 h-16 border-4 border-[#1B4CA1] opacity-5 pointer-events-none rotate-45" />
      <div className="absolute bottom-1/3 right-[5%] w-20 h-20 rounded-full bg-[#0B8A3C] opacity-5 pointer-events-none" />

      {/* Floating abstract decorative Memphis shapes (grid overlay + crosses) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1e1e1e 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. CONFETTI EFFECT (Rendered portably on trigger) */}
      {celebrationActive && <Confetti />}

      {/* 3. DESKTOP ASIDE PANEL (Vibrant Palette Theme Left Pane) */}
      <aside className="w-80 h-full bg-white border-r-4 border-[#1E1E1E] p-8 hidden lg:flex flex-col gap-6 relative z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-tighter leading-none mb-1">
            茜茜的调色学堂
          </h1>
          <p className="text-xs font-mono font-bold tracking-widest text-gray-400">
            COLOR MIXING SCHOOL
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Current selected level target color or default display */}
          <div className="p-4 bg-[#FFFDF0] border-3 border-[#1E1E1E] rounded-2xl shadow-[3px_3px_0px_0px_#1E1E1E]">
            <div className="text-[10px] font-bold uppercase opacity-50 mb-1 tracking-wider">
              {selectedLevel ? "当前挑战 Target" : "关卡进度 Progress"}
            </div>
            
            {selectedLevel ? (
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full flex-shrink-0 border-2 border-[#1E1E1E] shadow-sm">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: getRecipeColor(selectedLevel.recipe).hex,
                      boxShadow: "inset -4px -4px 8px rgba(0,0,0,0.25), inset 3px 3px 4px rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <div>
                  <div className="font-bold text-base leading-tight text-[#1E1E1E]">
                    {selectedLevel.name}
                  </div>
                  <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                    关卡 {selectedLevel.id < 10 ? `0${selectedLevel.id}` : selectedLevel.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-orange-400 border-2 border-[#1E1E1E] flex items-center justify-center text-white font-bold">
                  ★
                </div>
                <div>
                  <div className="font-bold text-base leading-tight text-[#1E1E1E]">
                    开启你的挑战
                  </div>
                  <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                    已通关 {progress.filter((p) => p.stars > 0).length} / 15 个关卡
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick status progress grid */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {LEVELS.map((level) => {
              const prog = progress.find((p) => p.levelId === level.id);
              const stars = prog ? prog.stars : 0;
              const isCurrent = selectedLevel?.id === level.id;
              const isUnlocked = level.id === 1 || (progress.find((p) => p.levelId === level.id - 1)?.stars || 0) > 0;

              if (stars > 0) {
                // Completed
                return (
                  <div
                    key={level.id}
                    title={`第 ${level.id} 关 (${stars} 星)`}
                    className="aspect-square bg-emerald-500 border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-[2px_2px_0px_0px_#1E1E1E]"
                  >
                    ★
                  </div>
                );
              } else if (isCurrent) {
                // Active current
                return (
                  <div
                    key={level.id}
                    title={`第 ${level.id} 关 (进行中)`}
                    className="aspect-square bg-[#FCE300] border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center text-[#1E1E1E] text-xs font-bold animate-pulse shadow-[2px_2px_0px_0px_#1E1E1E]"
                  >
                    {level.id < 10 ? `0${level.id}` : level.id}
                  </div>
                );
              } else if (isUnlocked) {
                // Unlocked but not completed
                return (
                  <div
                    key={level.id}
                    title={`第 ${level.id} 关 (已解锁)`}
                    className="aspect-square bg-white border-2 border-[#1E1E1E] rounded-xl flex items-center justify-center text-xs font-bold text-[#1E1E1E]"
                  >
                    {level.id < 10 ? `0${level.id}` : level.id}
                  </div>
                );
              } else {
                // Locked
                return (
                  <div
                    key={level.id}
                    title={`第 ${level.id} 关 (锁定)`}
                    className="aspect-square bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center text-xs text-gray-400"
                  >
                    {level.id < 10 ? `0${level.id}` : level.id}
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Bottom instructions */}
        <div className="mt-auto space-y-4">
          <div className="p-4 bg-red-500 text-white rounded-2xl border-3 border-[#1E1E1E] shadow-[4px_4px_0px_0px_#1E1E1E] text-center font-bold text-sm tracking-wider">
            如何调色？
          </div>
          <p className="text-xs leading-relaxed text-gray-600 font-sans">
            像油画颜料一样思考。蓝加黄会变成绿。加入白色会让颜色变浅变粉，加入黑色会让颜色变脏变暗。利用真实物理减色模型 mixbox，体验不一样的色彩魔法！
          </p>
        </div>
      </aside>

      {/* 4. MAIN WORKSPACE WITH PHONE ENVELOPE PREVIEW */}
      <main className="flex-1 h-full flex items-center justify-center relative p-0 sm:p-4 md:p-6 overflow-hidden">
        
        {/* Floating absolute badges on the right side of workspace (Vibrant Palette Theme decals) */}
        <div className="absolute top-10 right-10 hidden xl:flex flex-col items-end gap-2.5 pointer-events-none">
          <div className="bg-[#0B8A3C] text-white px-4 py-2 border-3 border-[#1E1E1E] rounded-full font-black text-xs rotate-3 shadow-[3px_3px_0px_0px_#1E1E1E]">
            物理调色算法 Mixbox
          </div>
          <div className="bg-white text-[#1E1E1E] px-4 py-2 border-3 border-[#1E1E1E] rounded-full font-bold text-xs -rotate-2 shadow-[3px_3px_0px_0px_#1E1E1E]">
            非 RGB 简单叠加
          </div>
        </div>

        {/* The Phone frame (Active on screens larger than mobile, matches styling from design) */}
        <div className="w-full h-full sm:w-[375px] sm:h-[667px] bg-white sm:rounded-[3rem] sm:border-[8px] sm:border-[#1E1E1E] sm:shadow-[16px_16px_0px_rgba(30,30,30,0.15)] overflow-hidden flex flex-col relative transition-all duration-300">
          <AnimatePresence mode="wait">
            {screen === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar"
              >
                <LevelSelect
                  progress={progress}
                  onSelectLevel={handleSelectLevel}
                  onResetProgress={handleResetProgress}
                  onSelectSurvival={handleSelectSurvival}
                  survivalHighScore={survivalHighScore}
                />
              </motion.div>
            )}

            {screen === "game" && selectedLevel && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                <GameScreen
                  level={selectedLevel}
                  onBack={() => {
                    setIsSurvivalMode(false);
                    handleBackToSelect();
                  }}
                  onLevelComplete={handleLevelComplete}
                  onNextLevel={handleNextLevel}
                  progress={progress}
                  isSurvival={isSurvivalMode}
                  survivalLives={survivalLives}
                  survivalScore={survivalScore}
                  survivalHighScore={survivalHighScore}
                  onSurvivalMix={handleSurvivalMix}
                  onSurvivalNext={handleSurvivalNext}
                  onSurvivalReset={handleSurvivalReset}
                />
              </motion.div>
            )}

            {screen === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 15 }}
                className="flex-1 flex flex-col h-full justify-center overflow-y-auto no-scrollbar"
              >
                <CompleteScreen onRestart={handleRestartCampaign} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
