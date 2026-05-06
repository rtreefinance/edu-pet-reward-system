import React from 'react';

interface CoinDisplayProps {
  coins: number;
  size?: 'sm' | 'md' | 'lg';
  showAnim?: boolean;
}

export default function CoinDisplay({ coins, size = 'md', showAnim = false }: CoinDisplayProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`inline-flex items-center gap-1.5 font-bold ${sizeClass}`}>
      <span className={showAnim ? 'animate-coin-pop inline-block' : 'inline-block'}>
        🪙
      </span>
      <span className="text-text-main">{coins.toLocaleString()}</span>
    </div>
  );
}
