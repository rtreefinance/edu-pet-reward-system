import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Calendar from '../components/Calendar';
import StreakBadge from '../components/StreakBadge';

export default function CheckInCalendar() {
  const { call } = useApi();
  const { refreshUser } = useAuth();
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [calendarData, streakData] = await Promise.all([
        call<{ checkInDates: string[]; total: number }>('/api/checkin'),
        call<{ streak: number }>('/api/checkin/streak').catch(() => ({ streak: 0 })),
      ]);
      setCheckInDates(calendarData.checkInDates || []);
      setStreak(streakData.streak);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await call<{ streak: number; coinReward: number }>('/api/checkin', {
        method: 'POST',
      });
      setStreak(res.streak);
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1500);
      await refreshUser();
      await loadData();
    } catch (err: any) {
      if (err.message?.includes('已经签到')) {
        alert('今天已经签到过了哦～明天再来吧！');
      } else {
        alert(err.message);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const todayStr = now.toISOString().slice(0, 10);
  const alreadyCheckedToday = checkInDates.includes(todayStr);
  const checkedCount = checkInDates.length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-text-main">📅 签到日历</h2>
            <p className="text-xs text-text-sub mt-1">
              {year}年{month}月 · 本月已签到 {checkedCount} 天
            </p>
          </div>
          <div className="text-center">
            <StreakBadge streak={streak} size="md" />
            <p className="text-xs text-text-sub mt-1">连续天数</p>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-7 gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <div key={j} className="skeleton aspect-square rounded-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Calendar year={year} month={month} checkedDates={checkInDates} />
        )}
      </div>

      {/* Check In Button */}
      <div className="card text-center py-6">
        {alreadyCheckedToday ? (
          <div className="animate-bounce-in">
            <span className="text-5xl block mb-3">🎉</span>
            <p className="text-lg font-extrabold text-green">今日已签到</p>
            <p className="text-sm text-text-sub mt-1">连续签到 {streak} 天，继续加油！</p>
            {streak >= 7 && (
              <p className="text-xs text-orange-400 mt-1 flame-anim inline-block">
                🔥 第{streak}天！太棒了！
              </p>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className={`btn-primary text-lg px-8 py-4 transition-all ${
                showSparkle ? 'scale-110' : ''
              }`}
            >
              {checkingIn ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin">🐾</span> 签到中...
                </span>
              ) : (
                '✅ 每日签到 (+10🪙)'
              )}
            </button>
            {showSparkle && (
              <div className="mt-3 animate-bounce-in">
                <span className="text-2xl">✨🎉✨</span>
                <p className="text-green font-bold mt-1">签到成功！</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <span className="text-2xl">📅</span>
          <p className="text-xs text-text-sub mt-1">本月签到</p>
          <p className="font-extrabold text-lg text-text-main">{checkedCount}天</p>
        </div>
        <div className="card text-center py-4">
          <span className="text-2xl">🔥</span>
          <p className="text-xs text-text-sub mt-1">连续签到</p>
          <p className="font-extrabold text-lg text-orange-500">{streak}天</p>
        </div>
        <div className="card text-center py-4">
          <span className="text-2xl">🪙</span>
          <p className="text-xs text-text-sub mt-1">签到收益</p>
          <p className="font-extrabold text-lg text-accent">+{(checkedCount * 10) + (Math.floor(streak / 7) * 50)}</p>
        </div>
      </div>
    </div>
  );
}
