/**
 * ActionButtons.jsx - 베팅 액션 버튼
 * 폴드 / 체크 / 콜 / 레이즈 / 올인
 */
import React, { useState } from 'react';

export default function ActionButtons({ gameState, isMyTurn, onAction }) {
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  if (!gameState || !isMyTurn) {
    return (
      <div className="px-4 py-3 text-center">
        <p className="text-gray-500 text-sm">
          {gameState ? '상대방 턴입니다...' : ''}
        </p>
      </div>
    );
  }

  const actions = gameState.availableActions || [];
  const myPlayer = gameState.players?.find((p) => p.id === gameState.currentPlayerId);
  const callAmount = gameState.currentBet - (myPlayer?.bet || 0);
  const minRaise = gameState.currentBet + gameState.bigBlind;

  const handleRaise = () => {
    if (showRaiseInput) {
      const amount = parseInt(raiseAmount, 10);
      if (amount && amount >= minRaise) {
        onAction('raise', amount);
        setShowRaiseInput(false);
        setRaiseAmount('');
      }
    } else {
      setShowRaiseInput(true);
      setRaiseAmount(String(minRaise));
    }
  };

  const handleQuickRaise = (multiplier) => {
    const amount = gameState.bigBlind * multiplier;
    onAction('raise', Math.max(amount, minRaise));
    setShowRaiseInput(false);
    setRaiseAmount('');
  };

  return (
    <div className="px-3 py-2">
      {/* 레이즈 입력 패널 */}
      {showRaiseInput && (
        <div className="flex items-center gap-2 mb-2 animate-slide-up">
          <input
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(e.target.value)}
            min={minRaise}
            className="flex-1 px-3 py-2 rounded-lg bg-poker-dark border border-gray-700
                       text-white text-center font-bold focus:outline-none focus:border-poker-gold"
          />
          <div className="flex gap-1">
            <button
              onClick={() => handleQuickRaise(3)}
              className="px-2 py-2 rounded-lg bg-gray-700 text-xs text-gray-300 font-medium"
            >
              3BB
            </button>
            <button
              onClick={() => handleQuickRaise(5)}
              className="px-2 py-2 rounded-lg bg-gray-700 text-xs text-gray-300 font-medium"
            >
              5BB
            </button>
            <button
              onClick={() => handleQuickRaise(10)}
              className="px-2 py-2 rounded-lg bg-gray-700 text-xs text-gray-300 font-medium"
            >
              10BB
            </button>
          </div>
          <button
            onClick={() => setShowRaiseInput(false)}
            className="px-2 py-2 text-gray-400 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 메인 액션 버튼들 */}
      <div className="flex gap-2">
        {actions.includes('fold') && (
          <button onClick={() => onAction('fold')} className="btn-fold flex-1">
            폴드
          </button>
        )}

        {actions.includes('check') && (
          <button onClick={() => onAction('check')} className="btn-check flex-1">
            체크
          </button>
        )}

        {actions.includes('call') && (
          <button onClick={() => onAction('call')} className="btn-call flex-1">
            콜 {callAmount > 0 ? callAmount.toLocaleString() : ''}
          </button>
        )}

        {actions.includes('raise') && (
          <button onClick={handleRaise} className="btn-raise flex-1">
            {showRaiseInput ? '확인' : '레이즈'}
          </button>
        )}

        {actions.includes('allIn') && (
          <button onClick={() => onAction('allIn')} className="btn-allin flex-1">
            올인
          </button>
        )}
      </div>
    </div>
  );
}
