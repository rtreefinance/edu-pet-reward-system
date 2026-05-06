import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { StudentUser, Pet, CheckIn } from '@shared/types';
import CoinDisplay from '../components/CoinDisplay';
import PetCard from '../components/PetCard';
import StreakBadge from '../components/StreakBadge';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { call } = useApi();
  const navigate = useNavigate();
  const student = user as StudentUser;

  const [pet, setPet] = useState<Pet | null>(null);
  const [petLoading, setPetLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [petData, streakData, hwData] = await Promise.all([
        call<{ pet: Pet; hasPet: boolean }>('/api/pet').catch(() => ({ pet: null, hasPet: false })),
        call<{ streak: number }>('/api/checkin/streak').catch(() => ({ streak: 0 })),
        call<{ homework: any[] }>('/api/homework?status=pending').catch(() => ({ homework: [] })),
      ]);
      if (petData.hasPet) setPet(petData.pet);
      else setPet(null);
      setStreak(streakData.streak);
      setHomeworkCount(hwData.homework?.length || 0);
    } catch (err) {
      // ignore
    } finally {
      setPetLoading(false);
    }
  }, [call]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await call<{ streak: number; coinReward: number; petMood: number | null }>('/api/checkin', {
        method: 'POST',
      });
      setStreak(res.streak);
      setShowCoinAnim(true);
      setTimeout(() => setShowCoinAnim(false), 1500);
      await refreshUser();
      if (res.petMood !== null && pet) {
        setPet({ ...pet, mood: res.petMood });
      }
    } catch (err: any) {
      if (err.message?.includes('已经签到')) {
        alert('你今天已经签到过了哦～');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleFeed = async () => {
    if (!pet) return;
    try {
      const res = await call<{ hunger: number; mood: number; coins: number; pet: Pet }>('/api/pet/feed', {
        method: 'POST',
      });
      setPet(res.pet);
      await refreshUser();
    } catch (err: any) {
      alert(err.message || '喂食失败');
    }
  };

  if (!student) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Top Bar: Coins + Level */}
      <div className="card flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-300 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Lv.{student.level}</span>
          </div>
          <div>
            <p className="text-xs text-text-sub">早上好～</p>
            <p className="font-bold text-text-main">{student.displayName}</p>
          </div>
        </div>
        <div className="relative">
          <CoinDisplay coins={student.coins} size="lg" showAnim={showCoinAnim} />
          {showCoinAnim && (
            <div className="absolute -top-2 -right-2 text-xs animate-bounce-in">+10</div>
          )}
        </div>
      </div>

      {/* Pet Card */}
      <div>
        <PetCard
          pet={pet}
          loading={petLoading}
          onAdoptClick={() => navigate('/pet')}
        />
        {pet && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleFeed}
              disabled={pet.hunger >= 100}
              className="flex-1 btn-secondary text-sm py-2.5 disabled:opacity-50"
            >
              🍖 喂食 (-5🪙)
            </button>
            <button
              onClick={() => navigate('/pet')}
              className="flex-1 btn-outline text-sm py-2.5"
            >
              📋 详情
            </button>
          </div>
        )}
      </div>

      {/* Middle: Streak + Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-5 cursor-pointer" onClick={() => navigate('/checkin')}>
          <StreakBadge streak={streak} />
          <p className="text-xs text-text-sub mt-1">连续签到</p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="card text-center py-5 border-0 bg-gradient-to-br from-green to-green-400 text-white cursor-pointer disabled:opacity-60"
        >
          <span className="text-3xl block mb-1">{checkingIn ? '⏳' : '✅'}</span>
          <span className="font-bold">{checkingIn ? '签到中...' : '每日签到'}</span>
          <span className="text-xs block mt-1 opacity-80">+10🪙</span>
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/homework')} className="card text-center py-4 hover:shadow-lg transition-shadow">
          <span className="text-2xl">📚</span>
          <p className="text-xs font-bold mt-1">我的作业</p>
          {homeworkCount > 0 && (
            <span className="badge-pink mt-1">{homeworkCount} 待完成</span>
          )}
        </button>
        <button onClick={() => navigate('/checkin')} className="card text-center py-4 hover:shadow-lg transition-shadow">
          <span className="text-2xl">📅</span>
          <p className="text-xs font-bold mt-1">签到日历</p>
        </button>
        <button onClick={() => navigate('/shop')} className="card text-center py-4 hover:shadow-lg transition-shadow">
          <span className="text-2xl">🛍️</span>
          <p className="text-xs font-bold mt-1">宠物商店</p>
        </button>
      </div>
    </div>
  );
}
