import React from 'react';

interface HungerMoodBarProps {
  hunger: number;  // 0-100
  mood: number;    // 0-100
}

export default function HungerMoodBar({ hunger, mood }: HungerMoodBarProps) {
  const hungerColor = hunger > 60 ? 'bg-green' : hunger > 30 ? 'bg-accent' : 'bg-red';
  const moodColor = mood > 60 ? 'bg-primary' : mood > 30 ? 'bg-accent' : 'bg-gray-400';

  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-sub">🍖 饱食度</span>
          <span className={hunger < 30 ? 'text-red-500 font-bold' : 'text-text-sub'}>{hunger}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${hungerColor}`}
            style={{ width: `${hunger}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-sub">💖 心情</span>
          <span className={mood < 30 ? 'text-gray-500 font-bold' : 'text-text-sub'}>{mood}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${moodColor}`}
            style={{ width: `${mood}%` }}
          />
        </div>
      </div>
    </div>
  );
}
