/**
 * Header.jsx - 상단 헤더 (로비용)
 */
import React from 'react';
import { useGame } from '../../context/GameContext';

export default function Header() {
  const { player } = useGame();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-poker-dark-lighter border-b border-gray-800">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold text-poker-gold tracking-wider">
          EDGE
        </h1>
        <span className="text-xs font-bold text-gray-400 tracking-widest">
          HOLDEM
        </span>
      </div>

      {player && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{player.nickname}</p>
            <p className="text-xs text-poker-gold font-medium">
              {player.chips?.toLocaleString()} 칩
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-poker-green flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {player.nickname[0]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
