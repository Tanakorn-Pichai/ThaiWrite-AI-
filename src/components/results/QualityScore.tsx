import React, { useEffect, useState } from 'react';

interface QualityScoreProps {
  score: number;
}

export const QualityScore: React.FC<QualityScoreProps> = ({ score }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar fill on mount or score change
    const timer = setTimeout(() => {
      setAnimatedProgress(score);
    }, 120);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreAssessment = (val: number) => {
    if (val >= 90) return { label: 'คุณภาพยอดเยี่ยม', color: 'text-[#006241]' };
    if (val >= 80) return { label: 'คุณภาพดีมาก', color: 'text-[#006241]' };
    if (val >= 70) return { label: 'ระดับปานกลาง', color: 'text-amber-700' };
    return { label: 'ควรปรับปรุง', color: 'text-rose-700' };
  };

  const assessment = getScoreAssessment(score);

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-[#DCE3DD] bg-white shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1E2923]">
            คะแนนคุณภาพภาษา
          </span>
          <span className={`text-xs font-medium hidden sm:inline ${assessment.color}`}>
            • {assessment.label}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-[#006241] tabular-nums">
            {score}
          </span>
          <span className="text-xs text-[#828F86] font-mono">/ 100</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-[#E2ECE5] h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          className="bg-[#006241] h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedProgress}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <p className="text-xs text-[#5A655E] mt-1.5 block sm:hidden">
        {assessment.label}
      </p>
    </div>
  );
};
