import React from 'react';

interface ShopItemProps {
  id: string;
  name: string;
  icon: string;
  price: number;
  type: string;
  owned: boolean;
  onBuy: (id: string) => void;
  disabled?: boolean;
}

export default function ShopItem({ id, name, icon, price, type, owned, onBuy, disabled }: ShopItemProps) {
  return (
    <div
      className={`card p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
        owned ? 'opacity-60 grayscale' : ''
      }`}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl">
        {icon}
      </div>

      {/* Name */}
      <p className="font-bold text-sm text-text-main text-center leading-tight">{name}</p>

      {/* Type badge */}
      <span className="text-xs text-text-sub bg-gray-100 px-2 py-0.5 rounded-full">{type}</span>

      {/* Price */}
      <div className="flex items-center gap-1 text-sm font-bold text-accent">
        <span>🪙</span>
        <span>{price}</span>
      </div>

      {/* Buy button */}
      {owned ? (
        <span className="badge-green text-xs">已拥有</span>
      ) : (
        <button
          onClick={() => onBuy(id)}
          disabled={disabled}
          className="w-full btn-primary text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          购买
        </button>
      )}
    </div>
  );
}
