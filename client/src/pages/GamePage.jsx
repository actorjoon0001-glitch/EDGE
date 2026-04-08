/**
 * GamePage.jsx - 게임 플레이 페이지
 * 포커 테이블, 카드, 베팅 버튼 등 게임 전체 UI
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import PokerTable from '../components/Game/PokerTable';
import ActionButtons from '../components/Game/ActionButtons';
import GameLog from '../components/Game/GameLog';
import ShowdownOverlay from '../components/Game/ShowdownOverlay';

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    player,
    gameState,
    showdownResult,
    leaveRoom,
    startGame,
    playerAction,
    playAgain,
  } = useGame();

  // 게임 상태가 없으면 로비로
  useEffect(() => {
    if (!gameState && !roomId) {
      navigate('/lobby', { replace: true });
    }
  }, [gameState, roomId, navigate]);

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/lobby');
  };

  const isMyTurn =
    gameState?.currentPlayerId === player?.id &&
    gameState?.phase !== 'waiting' &&
    gameState?.phase !== 'showdown';

  const myPlayer = gameState?.players?.find((p) => p.id === player?.id);

  return (
    <div className="h-full flex flex-col relative">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 bg-poker-dark-lighter border-b border-gray-800">
        <button
          onClick={handleLeave}
          className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          ← 나가기
        </button>
        <div className="text-center">
          <span className="text-poker-gold font-bold text-sm">
            {gameState?.roomName || 'EDGE HOLDEM'}
          </span>
          {gameState?.phase && gameState.phase !== 'waiting' && (
            <span className="text-gray-400 text-xs ml-2">
              | BB {gameState.bigBlind}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {myPlayer && (
            <span className="text-poker-gold font-medium">
              {myPlayer.chips.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* 포커 테이블 */}
      <div className="flex-1 relative overflow-hidden">
        {gameState ? (
          <PokerTable gameState={gameState} myPlayerId={player?.id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">게임 로딩 중...</p>
          </div>
        )}
      </div>

      {/* 게임 로그 */}
      {gameState?.logs && <GameLog logs={gameState.logs} />}

      {/* 하단 액션 버튼 */}
      <div className="bg-poker-dark-lighter border-t border-gray-800">
        {gameState?.phase === 'waiting' ? (
          <div className="px-4 py-3">
            <button
              onClick={startGame}
              disabled={gameState.players?.length < 2}
              className="w-full py-3 rounded-xl bg-poker-gold hover:bg-poker-gold-light
                         text-black font-bold text-lg transition-all active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameState.players?.length < 2
                ? `대기 중... (${gameState.players?.length || 0}/2명)`
                : '게임 시작!'}
            </button>
          </div>
        ) : gameState?.phase === 'showdown' ? (
          <div className="px-4 py-3">
            <button
              onClick={playAgain}
              className="w-full py-3 rounded-xl bg-poker-gold hover:bg-poker-gold-light
                         text-black font-bold text-lg transition-all active:scale-95"
            >
              다시 하기
            </button>
          </div>
        ) : (
          <ActionButtons
            gameState={gameState}
            isMyTurn={isMyTurn}
            onAction={playerAction}
          />
        )}
      </div>

      {/* 쇼다운 오버레이 */}
      {showdownResult && (
        <ShowdownOverlay result={showdownResult} myPlayerId={player?.id} />
      )}
    </div>
  );
}
