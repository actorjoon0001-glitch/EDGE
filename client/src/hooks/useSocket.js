/**
 * useSocket.js - Socket.IO 커스텀 훅
 * 소켓 연결 관리 및 이벤트 리스너 등록
 */
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || '';

let socketInstance = null;

/** 싱글턴 소켓 인스턴스 반환 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

/** 소켓 연결 훅 */
export function useSocket() {
  const socket = useRef(getSocket());

  useEffect(() => {
    const s = socket.current;
    if (!s.connected) {
      s.connect();
    }

    return () => {
      // 컴포넌트 언마운트 시 연결 유지 (SPA이므로)
    };
  }, []);

  /** 이벤트 emit + 콜백 (Promise 래핑) */
  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      socket.current.emit(event, data, (response) => {
        resolve(response);
      });
    });
  }, []);

  /** 이벤트 리스너 등록 */
  const on = useCallback((event, handler) => {
    socket.current.on(event, handler);
    return () => socket.current.off(event, handler);
  }, []);

  /** 이벤트 리스너 해제 */
  const off = useCallback((event, handler) => {
    socket.current.off(event, handler);
  }, []);

  return {
    socket: socket.current,
    emit,
    on,
    off,
    connected: socket.current?.connected,
  };
}
