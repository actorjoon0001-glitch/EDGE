/**
 * PlayerSeat.jsx - 플레이어 좌석 컴포넌트
 * 닉네임, 칩, 카드, 베팅액, 턴 표시
 */
import React from 'react';
import Card from './Card';

export default function PlayerSeat({ player, isMe, isCurrentTurn, isDealer, position }) {
  if (!player) return null;

  const isFolded = player.folded;
  const isAllIn = player.allIn;

  return (
    <div
      className={`absolute flex flex-col items-center ${position}
                  transition-all duration-300`}
    >
      {/* 카드 (내 좌석이면 앞면, 아니면 뒷면) */}
      {player.cardCount > 0 && (
        <div className="flex gap-0.5 mb-1">
          {isMe ? (
            // 내 카드: 앞면
            player.holeCards?.map((card, i) => (
              <Card key={i} card={card} size="sm" />
            ))
          ) : (
            // 상대 카드: 뒷면 (쇼다운이면 앞면)
            player.holeCards?.map((card, i) => (
              <Card key={i} card={card} size="sm" faceDown={!card} />
            ))
          )}
        </div>
      )}

      {/* 플레이어 정보 박스 */}
      <div
        className={`relative px-3 py-1.5 rounded-xl min-w-[80px] text-center
                    transition-all duration-300
                    ${isFolded ? 'opacity-40' : ''}
                    ${isCurrentTurn ? 'ring-2 ring-poker-gold animate-pulse-turn' : ''}
                    ${isMe ? 'bg-poker-green-dark border border-poker-green-light' : 'bg-poker-dark-card border border-gray-700'}`}
      >
        {/* 딜러 버튼 */}
        {isDealer && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white
                          text-black text-xs font-bold flex items-center justify-center shadow">
            D
          </span>
        )}

        {/* 올인 뱃지 */}
        {isAllIn && (
          <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full bg-poker-red
                          text-white text-[10px] font-bold shadow">
            ALL IN
          </span>
        )}

        <p className={`text-xs font-bold truncate max-w-[80px]
                       ${isMe ? 'text-poker-gold' : 'text-white'}`}>
          {player.nickname}
        </p>
        <p className="text-[10px] text-gray-300 font-medium">
          {player.chips.toLocaleString()}
        </p>
      </div>

      {/* 베팅액 */}
      {player.bet > 0 && (
        <div className="mt-1 px-2 py-0.5 rounded-full bg-poker-gold/20 border border-poker-gold/40">
          <span className="text-poker-gold text-[10px] font-bold">
            {player.bet.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
