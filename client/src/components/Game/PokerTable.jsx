/**
 * PokerTable.jsx - 포커 테이블 메인 컴포넌트
 * 타원형 다크 그린 테이블, 플레이어 좌석 배치
 */
import React, { useMemo } from 'react';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import { PHASE_NAMES } from '../../utils/cardUtils';

/**
 * 좌석 위치 (최대 6석)
 * 내 좌석을 항상 하단 중앙(인덱스0)에 놓고 나머지를 시계방향으로 배치
 */
const SEAT_POSITIONS_BY_COUNT = {
  2: [
    'bottom-2 left-1/2 -translate-x-1/2',       // 0: 하단 중앙 (나)
    'top-2 left-1/2 -translate-x-1/2',           // 1: 상단 중앙
  ],
  3: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'top-12 left-4',
    'top-12 right-4',
  ],
  4: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'top-1/2 -translate-y-1/2 left-2',
    'top-2 left-1/2 -translate-x-1/2',
    'top-1/2 -translate-y-1/2 right-2',
  ],
  5: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-16 left-2',
    'top-8 left-6',
    'top-8 right-6',
    'bottom-16 right-2',
  ],
  6: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-20 left-1',
    'top-10 left-2',
    'top-2 left-1/2 -translate-x-1/2',
    'top-10 right-2',
    'bottom-20 right-1',
  ],
};

export default function PokerTable({ gameState, myPlayerId }) {
  // 내 인덱스를 기준으로 좌석 재배치
  const { orderedPlayers, positions } = useMemo(() => {
    if (!gameState?.players) return { orderedPlayers: [], positions: [] };

    const players = gameState.players;
    const myIndex = players.findIndex((p) => p.id === myPlayerId);
    const count = players.length;
    const pos = SEAT_POSITIONS_BY_COUNT[count] || SEAT_POSITIONS_BY_COUNT[6];

    // 내 좌석을 0번으로 회전
    const ordered = [];
    for (let i = 0; i < count; i++) {
      const idx = (myIndex + i) % count;
      ordered.push(players[idx]);
    }

    return { orderedPlayers: ordered, positions: pos };
  }, [gameState?.players, myPlayerId]);

  if (!gameState) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* 테이블 (타원형) */}
      <div
        className="relative w-full max-w-lg h-64 rounded-[50%] border-4 border-poker-green-light
                   bg-gradient-to-b from-poker-green to-poker-green-dark
                   shadow-[inset_0_0_40px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.3)]"
      >
        {/* 테이블 중앙: 페이즈 + 팟 + 커뮤니티 카드 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {/* 페이즈 표시 */}
          {gameState.phase !== 'waiting' && (
            <span className="text-xs text-green-200/60 font-medium">
              {PHASE_NAMES[gameState.phase] || gameState.phase}
            </span>
          )}

          {/* 팟 */}
          {gameState.pot > 0 && (
            <div className="px-3 py-1 rounded-full bg-black/30 border border-poker-gold/30">
              <span className="text-poker-gold font-bold text-sm">
                POT {gameState.pot.toLocaleString()}
              </span>
            </div>
          )}

          {/* 커뮤니티 카드 */}
          <CommunityCards cards={gameState.communityCards} />
        </div>
      </div>

      {/* 플레이어 좌석들 */}
      {orderedPlayers.map((player, i) => (
        <PlayerSeat
          key={player.id}
          player={player}
          isMe={player.id === myPlayerId}
          isCurrentTurn={gameState.currentPlayerId === player.id}
          isDealer={gameState.players.indexOf(
            gameState.players.find((p) => p.id === player.id)
          ) === gameState.dealerIndex}
          position={positions[i] || ''}
        />
      ))}
    </div>
  );
}
