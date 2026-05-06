import React from 'react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const isMilestone = streak > 0 && streak % 7 === 0;
  const isHot = streak >= 7;

  return (
    <div className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-sm' : ''}`}>
      <span className={`${isHot ? 'flame-anim inline-block' : ''} ${isMilestone ? 'animate-sparkle' : ''}`}>
        {streak >= 30 ? '🔥' : streak >= 14 ? '🔥' : streak >= 7 ? '🔥' : '✨'}
      </span>
      <span className={`font-extrabold ${isHot ? 'text-orange-500' : 'text-text-sub'}`}>
        {streak}
      </span>
      <span className="text-xs text-text-sub">天</span>
    </div>
  );
}
