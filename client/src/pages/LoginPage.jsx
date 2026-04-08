/**
 * LoginPage.jsx - 로그인 / 닉네임 생성 페이지
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, player } = useGame();
  const navigate = useNavigate();

  // 이미 로그인 되어 있으면 로비로
  if (player) {
    navigate('/lobby', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('닉네임을 입력해주세요');
      return;
    }
    if (nickname.trim().length < 2) {
      setErrorMsg('닉네임은 2자 이상이어야 합니다');
      return;
    }
    if (nickname.trim().length > 10) {
      setErrorMsg('닉네임은 10자 이하여야 합니다');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const result = await login(nickname.trim());
    setLoading(false);

    if (result.success) {
      navigate('/lobby');
    } else {
      setErrorMsg(result.error || '로그인 실패');
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      {/* 로고 */}
      <div className="mb-10 text-center animate-fade-in">
        <h1 className="text-5xl font-extrabold text-poker-gold mb-2 tracking-wider">
          EDGE
        </h1>
        <h2 className="text-2xl font-bold text-white tracking-widest">
          HOLDEM
        </h2>
        <p className="text-gray-400 mt-3 text-sm">무료 소셜 텍사스 홀덤</p>
      </div>

      {/* 로그인 폼 */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-slide-up"
      >
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl bg-poker-dark-lighter border border-gray-700
                       text-white text-lg placeholder-gray-500
                       focus:outline-none focus:border-poker-gold focus:ring-1 focus:ring-poker-gold
                       transition-colors"
            autoFocus
          />
        </div>

        {errorMsg && (
          <p className="text-poker-red text-sm mb-3">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-poker-gold hover:bg-poker-gold-light
                     text-black font-bold text-lg transition-all duration-200
                     active:scale-95 disabled:opacity-50"
        >
          {loading ? '접속 중...' : '게임 시작'}
        </button>

        {/* 정책 안내 */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs leading-relaxed">
            본 게임은 무료 칩 기반 소셜 게임입니다.<br />
            실제 돈 도박이 아니며 현금 환전이 불가합니다.
          </p>
        </div>
      </form>
    </div>
  );
}
