/**
 * ShowdownOverlay.jsx - 쇼다운 결과 오버레이
 * 승자, 핸드, 획득 칩 표시
 */
import React from 'react';
import Card from './Card';

export default function ShowdownOverlay({ result, myPlayerId }) {
  if (!result) return null;

  const { winners, playerHands } = result;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="bg-poker-dark-lighter rounded-2xl border border-poker-gold/30 p-5 mx-4 max-w-sm w-full animate-slide-up">
        <h3 className="text-center text-poker-gold font-bold text-xl mb-4">
          SHOWDOWN
        </h3>

        {/* 승자 표시 */}
        {winners?.map((log, i) => (
          <p key={i} className="text-center text-white text-sm mb-1">
            {log.message}
          </p>
        ))}

        {/* 플레이어 핸드 공개 */}
        {playerHands && playerHands.length > 0 && (
          <div className="mt-4 space-y-3">
            {playerHands.map((ph) => (
              <div
                key={ph.playerId}
                className={`flex items-center gap-3 p-2 rounded-lg
                           ${ph.playerId === myPlayerId ? 'bg-poker-green-dark/30' : 'bg-poker-dark/50'}`}
              >
                <span className="text-sm font-medium text-white min-w-[60px]">
                  {ph.nickname}
                </span>
                <div className="flex gap-1">
                  {ph.holeCards?.map((card, i) => (
                    <Card key={i} card={card} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
