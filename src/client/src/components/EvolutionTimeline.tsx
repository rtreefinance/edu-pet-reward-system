import React from 'react';
import type { EvolutionRecord } from '@shared/types';

interface EvolutionTimelineProps {
  history: EvolutionRecord[];
}

const STAGE_EMOJI: Record<string, string> = {
  '成长期': '⭐',
  '成熟期': '🌟',
  '完全体': '💎',
  '究极体': '✨',
};

function getStageName(level: number): string {
  if (level >= 50) return '究极体';
  if (level >= 10) return '完全体';
  if (level >= 6) return '成熟期';
  if (level >= 3) return '成长期';
  return '幼年期';
}

function isKeyLevel(level: number): boolean {
  return level === 3 || level === 6 || level === 10 || level === 50;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function EvolutionTimeline({ history }: EvolutionTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="empty-state text-sm">
        <span className="text-3xl mb-2">🥚</span>
        <p>还没有进化记录</p>
        <p className="text-xs mt-1">达到 Lv.3/6/10/50 时将触发进化</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-5">
        {history.map((record, idx) => {
          const stage = getStageName(record.toLevel);
          const key = isKeyLevel(record.toLevel);
          const emoji = STAGE_EMOJI[stage] || '🐾';

          return (
            <div key={idx} className="relative">
              {/* Node circle */}
              <div
                className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs z-10 ${
                  key
                    ? 'bg-gradient-to-br from-accent to-yellow-400 shadow-[0_0_12px_rgba(255,230,109,0.6)]'
                    : 'bg-gray-200'
                }`}
              >
                <span>{emoji}</span>
              </div>

              {/* Content */}
              <div
                className={`rounded-xl p-3 ${
                  key ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text-main">{record.newSpecies}</span>
                  <span className="badge-pink text-xs">Lv.{record.toLevel}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-text-sub">
                  <span>{stage}</span>
                  <span>·</span>
                  <span>{formatDate(record.triggeredAt)}</span>
                  {key && <span className="text-accent ml-1">🔥</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
