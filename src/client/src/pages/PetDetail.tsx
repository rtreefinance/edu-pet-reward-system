import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { StudentUser, Pet } from '@shared/types';
import HungerMoodBar from '../components/HungerMoodBar';
import EvolutionTimeline from '../components/EvolutionTimeline';
import CoinDisplay from '../components/CoinDisplay';

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', bear: '🐻',
  panda: '🐼', fox: '🦊', chick: '🐤', frog: '🐸',
};

const SPECIES_COLOR: Record<string, string> = {
  cat: 'from-orange-300 to-orange-100',
  dog: 'from-yellow-300 to-yellow-100',
  rabbit: 'from-pink-300 to-pink-100',
  bear: 'from-amber-400 to-amber-200',
  panda: 'from-gray-300 to-gray-100',
  fox: 'from-orange-400 to-orange-200',
  chick: 'from-yellow-300 to-yellow-100',
  frog: 'from-green-400 to-green-200',
};

function getEvolutionSkin(species: string, level: number): string {
  const base = SPECIES_EMOJI[species] || '🐾';
  if (level >= 50) return `✨${base}✨`;
  if (level >= 10) return `💎${base}`;
  if (level >= 6) return `🌟${base}`;
  if (level >= 3) return `⭐${base}`;
  return base;
}

function getEvolutionLabel(level: number): string {
  if (level >= 50) return '究极体';
  if (level >= 10) return '完全体';
  if (level >= 6) return '成熟期';
  if (level >= 3) return '成长期';
  return '幼年期';
}

export default function PetDetail() {
  const { user, refreshUser } = useAuth();
  const { call } = useApi();
  const navigate = useNavigate();
  const student = user as StudentUser;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeding, setFeeding] = useState(false);
  const [feedMsg, setFeedMsg] = useState<string | null>(null);

  const loadPet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await call<{ pet: Pet; hasPet: boolean }>('/api/pet');
      if (res.hasPet) setPet(res.pet);
      else setPet(null);
    } catch (err: any) {
      setError(err.message || '加载宠物失败');
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const handleFeed = async () => {
    if (!pet || feeding) return;
    if (student.coins < 5) {
      alert('💰 金币不足，喂食需要 5 金币');
      return;
    }
    setFeeding(true);
    setFeedMsg(null);
    try {
      const res = await call<{ hunger: number; mood: number; coins: number; pet: Pet }>(
        '/api/pet/feed',
        { method: 'POST' }
      );
      setPet(res.pet);
      setFeedMsg('🍖 喂食成功！');
      setTimeout(() => setFeedMsg(null), 2000);
      await refreshUser();
    } catch (err: any) {
      alert(err.message || '喂食失败');
    } finally {
      setFeeding(false);
    }
  };

  if (!student) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="card p-6 flex flex-col items-center gap-4">
          <div className="skeleton w-40 h-40 rounded-full" />
          <div className="skeleton w-24 h-6" />
          <div className="skeleton w-32 h-4" />
          <div className="skeleton w-full h-16" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="empty-state">
          <span className="text-4xl mb-3">😿</span>
          <p className="font-bold text-text-main mb-1">加载失败</p>
          <p className="text-sm text-text-sub mb-4">{error}</p>
          <button onClick={loadPet} className="btn-secondary text-sm">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // No pet state
  if (!pet) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="empty-state">
          <div className="pet-body bg-gradient-to-br from-gray-200 to-gray-100 mx-auto mb-4">
            <span className="text-4xl opacity-30">❓</span>
          </div>
          <p className="font-bold text-text-main mb-1">还没有宠物</p>
          <p className="text-sm text-text-sub mb-4">完成作业获得金币后即可领养</p>
          <button onClick={() => navigate(-1)} className="btn-outline text-sm">
            ← 返回
          </button>
        </div>
      </div>
    );
  }

  const skin = pet.skin || getEvolutionSkin(pet.species, pet.level);
  const colorClass = SPECIES_COLOR[pet.species] || 'from-purple-300 to-purple-100';
  const xpPercent = Math.min(100, Math.round((pet.xp / (pet.level * 100)) * 100));

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Pet Avatar & Basic Info */}
      <div className="card p-6 text-center">
        <div className={`pet-body w-40 h-40 mx-auto mb-4 bg-gradient-to-br ${colorClass} shadow-lg`}>
          <span className="text-6xl animate-float select-none">{skin}</span>
        </div>

        <h1 className="text-2xl font-extrabold text-text-main">{pet.name}</h1>

        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          <span className="badge-pink">Lv.{pet.level}</span>
          <span className="text-sm text-text-sub">{getEvolutionLabel(pet.level)}</span>
          <span className="text-sm text-text-sub">·</span>
          <span className="text-sm text-text-sub">{pet.species}</span>
        </div>

        {/* XP bar */}
        <div className="mt-3 max-w-xs mx-auto">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-sub">XP</span>
            <span className="text-text-sub">{pet.xp} / {pet.level * 100}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple to-primary transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Coin balance */}
        <div className="mt-3">
          <CoinDisplay coins={student.coins} size="md" />
        </div>
      </div>

      {/* Hunger & Mood */}
      <div className="card p-5">
        <HungerMoodBar hunger={pet.hunger} mood={pet.mood} />

        {/* Feed button */}
        <div className="mt-4 text-center">
          <button
            onClick={handleFeed}
            disabled={feeding || pet.hunger >= 100}
            className="btn-primary text-lg px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {feeding ? '⏳ 喂食中...' : pet.hunger >= 100 ? '😋 吃饱了' : '🍖 喂食 (-5🪙)'}
          </button>
          {feedMsg && (
            <p className="text-sm text-green font-bold mt-2 animate-bounce-in">{feedMsg}</p>
          )}
        </div>
      </div>

      {/* Accessories */}
      <div className="card p-5">
        <h2 className="font-bold text-text-main mb-3">🎀 装饰品</h2>
        {pet.accessories.length === 0 ? (
          <p className="text-sm text-text-sub">还没有装饰品，去商店看看吧～</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {pet.accessories.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-pink-50 rounded-full px-3 py-1.5"
                title={a.name}
              >
                <span className="text-lg">{a.icon}</span>
                <span className="text-xs text-text-sub">{a.name}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate('/shop')}
          className="btn-outline text-sm mt-3 w-full"
        >
          🛍️ 去商店
        </button>
      </div>

      {/* Evolution Timeline */}
      <div className="card p-5">
        <h2 className="font-bold text-text-main mb-4">📜 进化时间线</h2>
        <EvolutionTimeline history={pet.evolutionHistory} />
      </div>

      {/* Back */}
      <div className="text-center pb-4">
        <button onClick={() => navigate(-1)} className="btn-outline text-sm">
          ← 返回首页
        </button>
      </div>
    </div>
  );
}
