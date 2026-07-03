import { motion } from "motion/react";
import { Palette, Award, RotateCcw } from "lucide-react";

interface CompleteScreenProps {
  onRestart: () => void;
}

export default function CompleteScreen({ onRestart }: CompleteScreenProps) {
  return (
    <div
      id="complete-screen-container"
      className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-full select-none"
    >
      {/* Decorative Memphis floating shapes */}
      <div className="absolute top-8 left-12 w-8 h-8 rounded-full border-4 border-[#0B8A3C] opacity-20 pointer-events-none animate-bounce" />
      <div className="absolute top-24 right-8 w-6 h-6 bg-[#C0186A] rotate-45 opacity-20 pointer-events-none" />
      <div className="absolute bottom-24 left-10 w-5 h-5 bg-[#FBB040] rounded-lg opacity-25 pointer-events-none" />

      {/* Main decorative medal & palette badge */}
      <motion.div
        initial={{ scale: 0.3, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 80 }}
        className="relative mb-8"
      >
        <div className="w-28 h-28 rounded-full bg-[#FCE300] border-4 border-[#1E1E1E] shadow-[6px_6px_0px_0px_#1E1E1E] flex items-center justify-center">
          <Palette className="w-14 h-14 text-[#1E1E1E]" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#E63329] border-3 border-[#1E1E1E] flex items-center justify-center shadow-md">
          <Award className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* Congratulatory Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl sm:text-4xl font-display font-bold text-[#1E1E1E] leading-none mb-3"
      >
        全部完成！🏆
      </motion.h1>

      {/* Inspiring encouragement text */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="max-w-xs sm:max-w-sm mb-10 bg-white p-5 rounded-2xl border-3 border-[#1E1E1E] shadow-[4px_4px_0px_0px_#1E1E1E]"
      >
        <p className="text-sm font-sans font-medium text-[#4A3D35] leading-relaxed">
          恭喜你！你已经圆满完成了
          <strong className="text-[#E63329]"> 15 个色彩调色关卡</strong>
          ！
        </p>
        <p className="text-xs font-sans text-[#7A6A5E] mt-3 leading-relaxed">
          你亲手掌握了
          <strong className="text-[#0B8A3C]"> 真实减色法物理颜料 </strong>
          的混色规律，了解了加白变淡、加黑压暗、以及互补色中和。你已经是一名优秀的色彩魔法师了！快到选择界面重温完美满分记录吧！🎨✨
        </p>
      </motion.div>

      {/* Replay action button */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={onRestart}
        className="cursor-pointer inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#1B4CA1] hover:bg-[#153B82] text-white text-base font-sans font-bold rounded-2xl border-3 border-[#1E1E1E] shadow-[4px_4px_0px_0px_#1E1E1E] hover:shadow-[6px_6px_0px_0px_#1E1E1E] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E1E1E] transition-all transform hover:-translate-y-0.5"
      >
        <RotateCcw className="w-5 h-5" />
        重温关卡列表
      </motion.button>
    </div>
  );
}
