/**
 * RoomList.jsx - 방 목록 컴포넌트
 */
import React from 'react';

export default function RoomList({ rooms, onJoin, loading }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 text-lg mb-2">열린 방이 없습니다</p>
        <p className="text-gray-600 text-sm">
          &quot;빠른 시작&quot; 또는 &quot;방 만들기&quot;를 눌러주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex items-center justify-between p-4 rounded-xl
                     bg-poker-dark-lighter border border-gray-800
                     hover:border-gray-700 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">{room.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">
                {room.playerCount}/{room.maxPlayers}명
              </span>
              <span className="text-xs text-gray-500">
                블라인드 {room.smallBlind}/{room.bigBlind}
              </span>
              <span
                className={`text-xs font-medium ${
                  room.phase === 'waiting'
                    ? 'text-green-400'
                    : 'text-poker-gold'
                }`}
              >
                {room.phase === 'waiting' ? '대기 중' : '게임 중'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onJoin(room.id)}
            disabled={loading || room.playerCount >= room.maxPlayers}
            className="px-5 py-2 rounded-lg bg-poker-green hover:bg-poker-green-light
                       text-white font-bold text-sm transition-all active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {room.playerCount >= room.maxPlayers ? '만석' : '참가'}
          </button>
        </div>
      ))}
    </div>
  );
}
