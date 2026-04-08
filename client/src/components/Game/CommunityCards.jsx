/**
 * CommunityCards.jsx - 커뮤니티 카드 (가운데 5장)
 */
import React from 'react';
import Card from './Card';

export default function CommunityCards({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="flex gap-1.5 justify-center">
      {cards.map((card, i) => (
        <Card key={i} card={card} size="md" />
      ))}
      {/* 아직 안 깔린 카드 자리 */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-12 h-16 rounded-lg border border-gray-700/30 bg-poker-green-dark/30"
        />
      ))}
    </div>
  );
}
