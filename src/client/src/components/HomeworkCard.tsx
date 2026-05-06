import React from 'react';
import type { Homework } from '@shared/types';
import { HomeworkStatus } from '@shared/types';

interface HomeworkCardProps {
  homework: Homework;
  teacherName?: string;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string; icon: string }> = {
  [HomeworkStatus.Pending]: { label: '待完成', color: 'bg-gray-100 text-gray-500', icon: '📝' },
  [HomeworkStatus.Submitted]: { label: '已提交', color: 'bg-blue-light text-blue', icon: '📤' },
  [HomeworkStatus.Graded]: { label: '已批改', color: 'bg-green-light text-green', icon: '✅' },
};

export default function HomeworkCard({ homework, teacherName, onClick }: HomeworkCardProps) {
  const statusInfo = STATUS_CONFIG[homework.status];
  const isPerfect = homework.status === HomeworkStatus.Graded && homework.score === homework.maxScore;

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer hover:shadow-lg transition-all relative overflow-hidden ${
        isPerfect ? 'ring-2 ring-accent' : ''
      }`}
    >
      {isPerfect && (
        <div className="absolute -top-1 -right-1 text-2xl animate-sparkle">⭐</div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-text-main truncate">{homework.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-sub">{homework.subject}</span>
            {teacherName && (
              <>
                <span className="text-xs text-text-sub">·</span>
                <span className="text-xs text-text-sub">{teacherName}</span>
              </>
            )}
          </div>
        </div>
        <span className={`badge shrink-0 ml-2 ${statusInfo.color}`}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>

      {homework.description && (
        <p className="text-sm text-text-sub mb-3 line-clamp-2">{homework.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-text-sub">
        <span>📅 {new Date(homework.dueDate).toLocaleDateString('zh-CN')}</span>
        {homework.status === HomeworkStatus.Graded && (
          <span className={`font-extrabold text-base ${
            homework.score >= 90 ? 'text-green' : homework.score >= 60 ? 'text-accent' : 'text-primary'
          }`}>
            {homework.score}/{homework.maxScore} 分
          </span>
        )}
        {homework.status === HomeworkStatus.Graded && homework.coinReward > 0 && (
          <span className="badge-yellow">+{homework.coinReward}🪙</span>
        )}
      </div>

      {/* Perfect score sparkle */}
      {isPerfect && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-8 text-lg animate-float opacity-80">✨</div>
        </div>
      )}
    </div>
  );
}
