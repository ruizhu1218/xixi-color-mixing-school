import { useState } from "react";
import { getRecipeColor, LEVELS } from "../data";
import { Level, LevelProgress } from "../types";
import { Lock, Star, Play, Trophy, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LevelSelectProps {
  progress: LevelProgress[];
  onSelectLevel: (level: Level) => void;
  onResetProgress: () => void;
  onSelectSurvival: () => void;
  survivalHighScore: number;
}

type TabType = "easy" | "medium" | "hard";

export default function LevelSelect({
  progress,
  onSelectLevel,
  onResetProgress,
  onSelectSurvival,
  survivalHighScore,
}: LevelSelectProps) {
  const [activeTab, setActiveTab] = useState<TabType>("easy");

  // Helper to check if a level is unlocked
  const isUnlocked = (levelId: number) => {
    if (levelId === 1) return true;
    const prevLevelProgress = progress.find((p) => p.levelId === levelId - 1);
    return prevLevelProgress ? prevLevelProgress.stars > 0 : false;
  };

  // Helper to get progress for a level
  const getLevelProgress = (levelId: number) => {
    return progress.find((p) => p.levelId === levelId);
  };

  // Filter levels based on the active tab
  const filteredLevels = LEVELS.filter((l) => l.difficulty === activeTab);

  return (
    <div id="level-select-container" className="flex flex-col min-h-full pb-8 select-none">
      {/* Page header with dynamic geometric background decals */}
      <div className="relative text-center pt-8 pb-4 px-4">
        {/* Decorative background shapes (Memphis theme) */}
        <div className="absolute top-2 left-6 w-8 h-8 rounded-full border-4 border-[#E63329] opacity-20 animate-pulse pointer-events-none" />
        <div className="absolute top-12 right-12 w-6 h-6 bg-[#FCE300] rotate-12 opacity-30 pointer-events-none" />
        <div className="absolute bottom-1 left-20 w-4 h-4 bg-[#1B4CA1] rounded-sm rotate-45 opacity-25 pointer-events-none" />

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1E1E1E] tracking-tight leading-none mb-2">
          茜茜的调色学堂
        </h1>
        <p className="text-sm sm:text-base font-sans font-medium text-[#6B5A4E]">
          🎨 实体颜料减色物理调色闯关游戏
        </p>
      </div>

      {/* RANDOM SURVIVAL CHALLENGE MODE BANNER / CARD */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto bg-gradient-to-br from-[#FFFBE8] to-[#FFF3D1] rounded-2xl border-3 border-[#1E1E1E] shadow-[4px_4px_0px_0px_#1E1E1E] p-4 relative overflow-hidden"
        >
          {/* Decorative badges */}
          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-[#FCE300]/20 pointer-events-none" />
          
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1 bg-[#F27D26] text-white text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wide mb-2 border border-[#1E1E1E]">
                <Sparkles className="w-3 h-3" />
                <span>全新模式 NEW MODE</span>
              </div>
              <h2 className="text-lg font-display font-black text-[#1E1E1E]">
                🎲 随机生存挑战
              </h2>
              <p className="text-xs text-[#6D5D4E] mt-1 mr-2 leading-relaxed max-w-[280px] sm:max-w-[340px]">
                3颗心起步，混合相似度达到 <strong>80%</strong> 即可通关下一层。难度随得分提升，看看你能坚持到第几关！
              </p>
            </div>

            {/* High Score Trophy Tag */}
            <div className="flex flex-col items-center bg-white py-1 px-2.5 rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] shrink-0">
              <Trophy className="w-5 h-5 text-[#F27D26] fill-[#F27D26]/20" />
              <span className="text-[9px] text-gray-500 font-bold uppercase mt-0.5 scale-90">最高纪录</span>
              <span className="text-sm font-black text-[#1E1E1E]">{survivalHighScore} 关</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-[#1E1E1E]/20 pt-3">
            <span className="text-[10px] text-[#8C7D6E] font-medium">
              💡 纯随机配方、调色大师终极试炼！
            </span>
            <button
              onClick={onSelectSurvival}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#FCE300] hover:bg-[#ebd200] text-[#1E1E1E] text-xs font-black rounded-xl border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_#1E1E1E] active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-[#1E1E1E]" />
              <span>开启生存赛</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* CAMPAIGN MODE SECTION */}
      <div className="px-4 mb-4 max-w-lg mx-auto w-full flex items-center justify-between">
        <h3 className="text-base font-display font-black text-[#1E1E1E]">
          🏆 闯关模式
        </h3>
        <span className="text-xs text-gray-500 font-mono font-medium">
          已收集 {progress.reduce((acc, p) => acc + p.stars, 0)} / 45 ⭐
        </span>
      </div>

      {/* TABS SELECTOR */}
      <div className="px-4 mb-5">
        <div className="max-w-lg mx-auto bg-[#F3EFE9] p-1 rounded-xl border-2 border-[#1E1E1E] grid grid-cols-3 gap-1 shadow-[2px_2px_0px_0px_#1E1E1E]">
          <button
            onClick={() => setActiveTab("easy")}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "easy"
                ? "bg-white text-[#1E1E1E] shadow-[1px_1px_0px_0px_#1E1E1E] border border-[#1E1E1E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🟢 初学入门
          </button>
          <button
            onClick={() => setActiveTab("medium")}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "medium"
                ? "bg-[#FFFCE0] text-[#B58B12] shadow-[1px_1px_0px_0px_#1E1E1E] border border-[#1E1E1E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🟡 色彩进阶
          </button>
          <button
            onClick={() => setActiveTab("hard")}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "hard"
                ? "bg-[#FFEBEB] text-[#8C2D2A] shadow-[1px_1px_0px_0px_#1E1E1E] border border-[#1E1E1E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🔴 色彩大师
          </button>
        </div>
      </div>

      {/* Grid of levels */}
      <div className="px-4 flex-1">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {filteredLevels.map((level, idx) => {
            const unlocked = isUnlocked(level.id);
            const prog = getLevelProgress(level.id);
            const stars = prog ? prog.stars : 0;
            const { hex: targetHex } = getRecipeColor(level.recipe);

            // Stagger animation delay
            const delay = idx * 0.05;

            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay }}
                disabled={!unlocked}
                onClick={() => onSelectLevel(level)}
                className={`group relative flex flex-col text-left rounded-2xl border-3 border-[#1E1E1E] transition-all overflow-hidden ${
                  unlocked
                    ? "cursor-pointer hover:-translate-y-1 bg-white shadow-[4px_4px_0px_0px_#1E1E1E] hover:shadow-[6px_6px_0px_0px_#1E1E1E] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#1E1E1E]"
                    : "bg-[#EAE5DF] text-gray-500 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] opacity-75"
                }`}
                style={
                  unlocked && stars > 0
                    ? {
                        borderColor: "#1E1E1E",
                        // Add very soft target color background highlight
                        backgroundColor: `${targetHex}0b`, 
                      }
                    : {}
                }
              >
                {/* Stage Index Tag */}
                <div className="absolute top-2 left-2.5 px-2 py-0.5 rounded-lg bg-[#1E1E1E] text-white text-[10px] font-display font-semibold uppercase tracking-wider">
                  第 {level.id < 10 ? `0${level.id}` : level.id} 关
                </div>

                {/* Level Card content */}
                <div className="flex flex-col items-center pt-9 pb-3 px-3 text-center w-full flex-1">
                  {/* Lock or Target Color Sphere */}
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center mb-2.5 border-2 border-[#1E1E1E]">
                    {unlocked ? (
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: targetHex,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#BFB9B2] flex items-center justify-center">
                        <Lock className="w-5 h-5 text-[#6D655E]" />
                      </div>
                    )}
                  </div>

                  {/* Level Name */}
                  <h3 className={`text-sm font-bold font-sans tracking-tight line-clamp-1 mb-1 ${
                    unlocked ? "text-[#1E1E1E]" : "text-[#7D756E]"
                  }`}>
                    {level.name}
                  </h3>

                  {/* Brief description */}
                  <p className="text-[10px] text-[#8C7D73] leading-tight line-clamp-2 min-h-[2.5em]">
                    {unlocked ? level.description : "通过前一关卡解锁"}
                  </p>
                </div>

                {/* Stars container */}
                {unlocked && (
                  <div className="w-full py-1.5 px-3 border-t-2 border-[#1E1E1E] bg-[#FFFBF5] flex items-center justify-center gap-1">
                    {[1, 2, 3].map((starIdx) => {
                      const fillStar = starIdx <= stars;
                      return (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            fillStar
                              ? "fill-[#FCE300] text-[#1E1E1E]"
                              : "text-gray-300"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Reset progress block (only visible if any progress exists) */}
      {progress.length > 0 && (
        <div className="mt-8 text-center px-4">
          <button
            onClick={() => {
              if (window.confirm("确定要重置所有关卡记录吗？所有的星星将会被清空。")) {
                onResetProgress();
              }
            }}
            className="px-4 py-2 text-xs font-sans font-bold text-[#8C3D3A] hover:bg-[#FCECEB] rounded-xl border border-dashed border-[#8C3D3A]/40 active:scale-95 transition-all"
          >
            🗑 重置我的学习进度
          </button>
        </div>
      )}
    </div>
  );
}
