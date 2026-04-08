/**
 * CreateRoomModal.jsx - 방 만들기 모달
 */
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function CreateRoomModal({ onClose }) {
  const { createRoom } = useGame();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [blindLevel, setBlindLevel] = useState('50/100');
  const [loading, setLoading] = useState(false);

  const BLIND_OPTIONS = [
    { label: '50/100', sb: 50, bb: 100 },
    { label: '100/200', sb: 100, bb: 200 },
    { label: '250/500', sb: 250, bb: 500 },
    { label: '500/1000', sb: 500, bb: 1000 },
  ];

  const handleCreate = async () => {
    setLoading(true);
    const blind = BLIND_OPTIONS.find((b) => b.label === blindLevel);
    await createRoom({
      name: name.trim() || undefined,
      maxPlayers,
      smallBlind: blind.sb,
      bigBlind: blind.bb,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-poker-dark-lighter rounded-2xl border border-gray-700 p-5 animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-5">방 만들기</h2>

        {/* 방 이름 */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-1">
            방 이름 (선택)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="방 이름 입력"
            maxLength={20}
            className="w-full px-3 py-2 rounded-lg bg-poker-dark border border-gray-700
                       text-white placeholder-gray-500 focus:outline-none focus:border-poker-gold"
          />
        </div>

        {/* 최대 인원 */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            최대 인원
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  maxPlayers === n
                    ? 'bg-poker-gold text-black'
                    : 'bg-poker-dark text-gray-400 border border-gray-700'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>
        </div>

        {/* 블라인드 */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            블라인드
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BLIND_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setBlindLevel(opt.label)}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  blindLevel === opt.label
                    ? 'bg-poker-gold text-black'
                    : 'bg-poker-dark text-gray-400 border border-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600
                       text-white font-bold transition-all"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-poker-gold hover:bg-poker-gold-light
                       text-black font-bold transition-all disabled:opacity-50"
          >
            {loading ? '생성 중...' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
