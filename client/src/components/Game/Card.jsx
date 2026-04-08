/**
 * Card.jsx - 개별 카드 컴포넌트
 * 앞면: 숫자 + 문양  |  뒷면: 파란색 패턴
 */
import React from 'react';

const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export default function Card({ card, size = 'md', faceDown = false, className = '' }) {
  const sizes = {
    sm: 'w-8 h-11 text-xs',
    md: 'w-12 h-16 text-sm',
    lg: 'w-16 h-22 text-lg',
  };

  // 뒷면
  if (faceDown || !card) {
    return (
      <div
        className={`${sizes[size]} rounded-lg bg-gradient-to-br from-blue-600 to-blue-800
                    border-2 border-blue-400 shadow-lg flex items-center justify-center
                    animate-card-deal ${className}`}
      >
        <span className="text-blue-300 font-bold opacity-60">E</span>
      </div>
    );
  }

  const suitColor = SUIT_COLORS[card.suit] || 'text-gray-900';
  const symbol = SUIT_SYMBOLS[card.suit] || '';
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div
      className={`${sizes[size]} rounded-lg bg-white shadow-lg flex flex-col
                  items-center justify-center font-bold select-none
                  animate-card-deal ${className}`}
    >
      <span className={`leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.name}
      </span>
      <span className={`leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {symbol}
      </span>
    </div>
  );
}
