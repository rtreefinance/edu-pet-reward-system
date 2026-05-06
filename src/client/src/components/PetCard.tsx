import React from 'react';
import type { Pet } from '@shared/types';
import HungerMoodBar from './HungerMoodBar';

interface PetCardProps {
  pet: Pet | null;
  onAdoptClick?: () => void;
  loading?: boolean;
}

const SPECIES_EMOJI: Record<string, { emoji: string; color: string }> = {
  cat: { emoji: '🐱', color: 'from-orange-300 to-orange-100' },
  dog: { emoji: '🐶', color: 'from-yellow-300 to-yellow-100' },
  rabbit: { emoji: '🐰', color: 'from-pink-300 to-pink-100' },
  bear: { emoji: '🐻', color: 'from-amber-400 to-amber-200' },
  panda: { emoji: '🐼', color: 'from-gray-300 to-gray-100' },
  fox: { emoji: '🦊', color: 'from-orange-400 to-orange-200' },
  chick: { emoji: '🐤', color: 'from-yellow-300 to-yellow-100' },
  frog: { emoji: '🐸', color: 'from-green-400 to-green-200' },
};

function getEvolutionSkin(species: string, level: number): string {
  const base = SPECIES_EMOJI[species]?.emoji || '🐾';
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

function getEvolutionBadgeColor(level: number): string {
  if (level >= 50) return 'badge-purple';
  if (level >= 10) return 'badge-pink';
  if (level >= 6) return 'badge-blue';
  if (level >= 3) return 'badge-green';
  return 'badge-yellow';
}

export default function PetCard({ pet, onAdoptClick, loading }: PetCardProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-32 h-32 rounded-full" />
          <div className="skeleton w-20 h-4" />
          <div className="skeleton w-full h-16" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="card p-6 text-center">
        <div className="pet-body bg-gradient-to-br from-gray-200 to-gray-100 mx-auto mb-4">
          <span className="text-4xl opacity-30">❓</span>
        </div>
        <p className="text-text-sub mb-4">还没有领养宠物哦～</p>
        {onAdoptClick && (
          <button onClick={onAdoptClick} className="btn-primary">
            🐣 领养一只宠物
          </button>
        )}
      </div>
    );
  }

  const speciesInfo = SPECIES_EMOJI[pet.species] || { emoji: '🐾', color: 'from-purple-300 to-purple-100' };

  return (
    <div className="card p-5">
      {/* Pet Avatar */}
      <div className="flex justify-center mb-4">
        <div
          className={`pet-body w-32 h-32 bg-gradient-to-br ${speciesInfo.color} shadow-lg`}
        >
          <span className="text-5xl animate-float select-none">
            {getEvolutionSkin(pet.species, pet.level)}
          </span>
        </div>
      </div>

      {/* Name & Level */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-extrabold text-text-main">{pet.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`${getEvolutionBadgeColor(pet.level)}`}>
            Lv.{pet.level}
          </span>
          <span className="text-xs text-text-sub">{getEvolutionLabel(pet.level)}</span>
        </div>
      </div>

      {/* HUD Bars */}
      <HungerMoodBar hunger={pet.hunger} mood={pet.mood} />

      {/* Accessories */}
      {pet.accessories.length > 0 && (
        <div className="mt-3 flex justify-center gap-1 flex-wrap">
          {pet.accessories.map((a, i) => (
            <span key={i} className="text-lg" title={a.name}>
              {a.icon}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
