/**
 * LobbyPage.jsx - 메인 로비 페이지
 * 방 목록, 빠른 시작, 방 만들기
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Header from '../components/common/Header';
import CreateRoomModal from '../components/Lobby/CreateRoomModal';
import RoomList from '../components/Lobby/RoomList';

export default function LobbyPage() {
  const { player, rooms, refreshRooms, quickJoin, joinRoom, currentRoomId } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 방 목록 로드
  useEffect(() => {
    refreshRooms();
    const interval = setInterval(refreshRooms, 5000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  // 방에 들어가면 게임 페이지로 이동
  useEffect(() => {
    if (currentRoomId) {
      navigate(`/game/${currentRoomId}`);
    }
  }, [currentRoomId, navigate]);

  const handleQuickJoin = async () => {
    setLoading(true);
    await quickJoin();
    setLoading(false);
  };

  const handleJoinRoom = async (roomId) => {
    setLoading(true);
    await joinRoom(roomId);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* 빠른 시작 & 방 만들기 버튼 */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            onClick={handleQuickJoin}
            disabled={loading}
            className="py-4 rounded-xl bg-poker-gold hover:bg-poker-gold-light
                       text-black font-bold text-lg transition-all active:scale-95
                       disabled:opacity-50"
          >
            {loading ? '참가 중...' : '빠른 시작'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-4 rounded-xl bg-poker-green hover:bg-poker-green-light
                       text-white font-bold text-lg transition-all active:scale-95"
          >
            방 만들기
          </button>
        </div>

        {/* 방 목록 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">방 목록</h2>
            <button
              onClick={refreshRooms}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              새로고침
            </button>
          </div>

          <RoomList rooms={rooms} onJoin={handleJoinRoom} loading={loading} />
        </div>
      </div>

      {/* 방 만들기 모달 */}
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
