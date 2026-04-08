/**
 * GameManager.js - 전체 게임 방 관리자
 * 모든 GameRoom 인스턴스를 생성/관리/삭제한다.
 */
const { v4: uuidv4 } = require('uuid');
const { GameRoom } = require('./GameRoom');

class GameManager {
  constructor() {
    /** @type {Map<string, GameRoom>} */
    this.rooms = new Map();

    /** @type {Map<string, object>} playerId -> { id, nickname, chips, roomId } */
    this.players = new Map();
  }

  /** 플레이어 등록 (로그인 시) */
  registerPlayer(id, nickname) {
    const player = {
      id,
      nickname,
      chips: 10000,  // 무료 시작 칩
      roomId: null,
    };
    this.players.set(id, player);
    return player;
  }

  /** 플레이어 정보 조회 */
  getPlayer(id) {
    return this.players.get(id);
  }

  /** 방 생성 */
  createRoom(options = {}) {
    const roomId = uuidv4().slice(0, 8);
    const room = new GameRoom(roomId, options);
    this.rooms.set(roomId, room);
    return room;
  }

  /** 방 조회 */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /** 전체 방 목록 */
  getRoomList() {
    return Array.from(this.rooms.values()).map((room) => room.getRoomInfo());
  }

  /** 방 참가 */
  joinRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '방을 찾을 수 없습니다' };

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: '플레이어를 찾을 수 없습니다' };

    // 이미 다른 방에 있으면 나가기
    if (player.roomId && player.roomId !== roomId) {
      this.leaveRoom(player.roomId, playerId);
    }

    const result = room.addPlayer({
      id: playerId,
      nickname: player.nickname,
      chips: player.chips,
    });

    if (result.success) {
      player.roomId = roomId;
    }
    return result;
  }

  /** 방 나가기 */
  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.removePlayer(playerId);
    const player = this.players.get(playerId);
    if (player) {
      // 남은 칩 동기화
      const roomPlayer = room.players.find((p) => p.id === playerId);
      if (roomPlayer) {
        player.chips = roomPlayer.chips;
      }
      player.roomId = null;
    }

    // 방에 아무도 없으면 삭제
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    }

    return removed;
  }

  /** 빠른 게임 - 비어있는 방에 참가하거나 새로 생성 */
  quickJoin(playerId) {
    // 2명 이상 자리가 있는 방 찾기
    for (const room of this.rooms.values()) {
      if (room.players.length < room.maxPlayers && room.phase === 'waiting') {
        return this.joinRoom(room.id, playerId);
      }
    }

    // 없으면 새로 생성
    const room = this.createRoom({ creatorId: playerId });
    return this.joinRoom(room.id, playerId);
  }

  /** 플레이어 연결 해제 처리 */
  handleDisconnect(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    if (player.roomId) {
      const room = this.rooms.get(player.roomId);
      if (room) {
        const roomPlayer = room.players.find((p) => p.id === playerId);
        if (roomPlayer) {
          roomPlayer.isConnected = false;
        }
      }
    }
  }
}

// 싱글턴 인스턴스
const gameManager = new GameManager();
module.exports = { gameManager, GameManager };
