/**
 * GameContext.jsx - 전역 게임 상태 관리
 * 플레이어 정보, 게임 상태, 소켓 이벤트 리스닝
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { emit, on } = useSocket();

  // 플레이어 정보
  const [player, setPlayer] = useState(null);

  // 현재 방 ID
  const [currentRoomId, setCurrentRoomId] = useState(null);

  // 게임 상태 (서버에서 받은 전체 상태)
  const [gameState, setGameState] = useState(null);

  // 방 목록
  const [rooms, setRooms] = useState([]);

  // 쇼다운 결과
  const [showdownResult, setShowdownResult] = useState(null);

  // 에러 메시지
  const [error, setError] = useState(null);

  // ===== 소켓 이벤트 리스닝 =====
  useEffect(() => {
    const cleanups = [
      on('game:stateUpdate', (state) => {
        setGameState(state);
        if (state.phase === 'showdown') {
          // 쇼다운 상태를 잠시 유지
        }
      }),
      on('game:showdown', (result) => {
        setShowdownResult(result);
      }),
      on('room:listUpdate', (roomList) => {
        setRooms(roomList);
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [on]);

  // ===== 액션 함수들 =====

  /** 로그인 */
  const login = useCallback(async (nickname) => {
    const result = await emit('player:login', { nickname });
    if (result.success) {
      setPlayer(result.player);
    }
    return result;
  }, [emit]);

  /** 방 목록 새로고침 */
  const refreshRooms = useCallback(async () => {
    const roomList = await emit('room:list');
    setRooms(roomList || []);
  }, [emit]);

  /** 방 만들기 */
  const createRoom = useCallback(async (options) => {
    const result = await emit('room:create', options);
    if (result.success) {
      setCurrentRoomId(result.roomId);
    }
    return result;
  }, [emit]);

  /** 방 참가 */
  const joinRoom = useCallback(async (roomId) => {
    const result = await emit('room:join', { roomId });
    if (result.success) {
      setCurrentRoomId(result.roomId);
    }
    return result;
  }, [emit]);

  /** 빠른 참가 */
  const quickJoin = useCallback(async () => {
    const result = await emit('room:quickJoin');
    if (result.success) {
      setCurrentRoomId(result.roomId);
    }
    return result;
  }, [emit]);

  /** 방 나가기 */
  const leaveRoom = useCallback(async () => {
    const result = await emit('room:leave');
    if (result.success) {
      setCurrentRoomId(null);
      setGameState(null);
      setShowdownResult(null);
    }
    return result;
  }, [emit]);

  /** 게임 시작 */
  const startGame = useCallback(async () => {
    const result = await emit('game:start');
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, [emit]);

  /** 플레이어 액션 */
  const playerAction = useCallback(async (action, amount) => {
    setShowdownResult(null);
    const result = await emit('player:action', { action, amount });
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, [emit]);

  /** 다시 하기 */
  const playAgain = useCallback(async () => {
    setShowdownResult(null);
    const result = await emit('game:playAgain');
    return result;
  }, [emit]);

  /** 에러 초기화 */
  const clearError = useCallback(() => setError(null), []);

  const value = {
    // 상태
    player,
    currentRoomId,
    gameState,
    rooms,
    showdownResult,
    error,
    // 액션
    login,
    refreshRooms,
    createRoom,
    joinRoom,
    quickJoin,
    leaveRoom,
    startGame,
    playerAction,
    playAgain,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
