/**
 * socketHandler.js - Socket.IO 이벤트 핸들러
 * 클라이언트와 서버 간 실시간 통신을 담당
 *
 * 이벤트 목록:
 * - player:login       플레이어 닉네임 등록
 * - room:list          방 목록 조회
 * - room:create        방 생성
 * - room:join          방 참가
 * - room:leave         방 나가기
 * - room:quickJoin     빠른 참가
 * - game:start         게임 시작
 * - player:action      플레이어 액션 (fold/check/call/raise/allIn)
 * - game:playAgain     다시 하기
 */
const { gameManager } = require('../game/GameManager');
const { PHASES } = require('../game/GameRoom');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 연결: ${socket.id}`);
    let playerId = socket.id;

    // ===== 플레이어 로그인 =====
    socket.on('player:login', (data, callback) => {
      const { nickname } = data;
      if (!nickname || nickname.trim().length === 0) {
        return callback?.({ success: false, error: '닉네임을 입력해주세요' });
      }

      const player = gameManager.registerPlayer(playerId, nickname.trim());
      console.log(`👤 로그인: ${player.nickname} (${playerId})`);
      callback?.({ success: true, player });
    });

    // ===== 방 목록 =====
    socket.on('room:list', (callback) => {
      const rooms = gameManager.getRoomList();
      callback?.(rooms);
    });

    // ===== 방 생성 =====
    socket.on('room:create', (data, callback) => {
      const player = gameManager.getPlayer(playerId);
      if (!player) return callback?.({ success: false, error: '로그인이 필요합니다' });

      const room = gameManager.createRoom({
        name: data?.name || `${player.nickname}의 방`,
        maxPlayers: data?.maxPlayers || 6,
        smallBlind: data?.smallBlind || 50,
        bigBlind: data?.bigBlind || 100,
        creatorId: playerId,
      });

      const result = gameManager.joinRoom(room.id, playerId);
      if (result.success) {
        socket.join(room.id);
        io.emit('room:listUpdate', gameManager.getRoomList());
        callback?.({ success: true, roomId: room.id });
      } else {
        callback?.(result);
      }
    });

    // ===== 방 참가 =====
    socket.on('room:join', (data, callback) => {
      const { roomId } = data;
      const result = gameManager.joinRoom(roomId, playerId);

      if (result.success) {
        socket.join(roomId);
        const room = gameManager.getRoom(roomId);

        // 방의 모든 플레이어에게 업데이트 전송
        broadcastRoomState(io, room);
        io.emit('room:listUpdate', gameManager.getRoomList());
        callback?.({ success: true, roomId });
      } else {
        callback?.(result);
      }
    });

    // ===== 빠른 참가 =====
    socket.on('room:quickJoin', (callback) => {
      const player = gameManager.getPlayer(playerId);
      if (!player) return callback?.({ success: false, error: '로그인이 필요합니다' });

      const result = gameManager.quickJoin(playerId);
      if (result.success) {
        const room = gameManager.getRoom(player.roomId);
        socket.join(room.id);
        broadcastRoomState(io, room);
        io.emit('room:listUpdate', gameManager.getRoomList());
        callback?.({ success: true, roomId: room.id });
      } else {
        callback?.(result);
      }
    });

    // ===== 방 나가기 =====
    socket.on('room:leave', (callback) => {
      const player = gameManager.getPlayer(playerId);
      if (!player || !player.roomId) return callback?.({ success: false });

      const roomId = player.roomId;
      const room = gameManager.getRoom(roomId);
      gameManager.leaveRoom(roomId, playerId);
      socket.leave(roomId);

      if (room && room.players.length > 0) {
        broadcastRoomState(io, room);
      }
      io.emit('room:listUpdate', gameManager.getRoomList());
      callback?.({ success: true });
    });

    // ===== 게임 시작 =====
    socket.on('game:start', (callback) => {
      const player = gameManager.getPlayer(playerId);
      if (!player || !player.roomId) return callback?.({ success: false, error: '방에 참가해주세요' });

      const room = gameManager.getRoom(player.roomId);
      if (!room) return callback?.({ success: false, error: '방을 찾을 수 없습니다' });

      const result = room.startGame();
      if (result.success) {
        broadcastRoomState(io, room);
        callback?.({ success: true });
      } else {
        callback?.(result);
      }
    });

    // ===== 플레이어 액션 =====
    socket.on('player:action', (data, callback) => {
      const { action, amount } = data;
      const player = gameManager.getPlayer(playerId);
      if (!player || !player.roomId) return callback?.({ success: false, error: '방에 참가해주세요' });

      const room = gameManager.getRoom(player.roomId);
      if (!room) return callback?.({ success: false, error: '방을 찾을 수 없습니다' });

      const result = room.handleAction(playerId, action, amount);

      if (result.success) {
        // 쇼다운이면 결과 전송
        if (room.phase === PHASES.SHOWDOWN) {
          const showdownResult = result.gameResult || room.showdown?.() || null;
          broadcastRoomState(io, room);

          // 쇼다운 결과를 별도 이벤트로 전송
          io.to(room.id).emit('game:showdown', {
            winners: room.logs.filter((l) => l.message.includes('승리')),
            communityCards: room.communityCards,
            playerHands: room.players
              .filter((p) => !p.folded)
              .map((p) => ({
                playerId: p.id,
                nickname: p.nickname,
                holeCards: p.holeCards,
              })),
          });
        } else {
          broadcastRoomState(io, room);
        }
        callback?.({ success: true });
      } else {
        callback?.(result);
      }
    });

    // ===== 다시 하기 =====
    socket.on('game:playAgain', (callback) => {
      const player = gameManager.getPlayer(playerId);
      if (!player || !player.roomId) return callback?.({ success: false });

      const room = gameManager.getRoom(player.roomId);
      if (!room) return callback?.({ success: false });

      // 칩이 0인 플레이어에게 무료 칩 지급 (소셜 게임)
      for (const p of room.players) {
        if (p.chips <= 0) {
          p.chips = 5000;
          room.addLog(`${p.nickname}님에게 무료 칩 5,000개가 지급되었습니다!`);
        }
      }

      const result = room.startGame();
      if (result.success) {
        broadcastRoomState(io, room);
        callback?.({ success: true });
      } else {
        callback?.(result);
      }
    });

    // ===== 연결 해제 =====
    socket.on('disconnect', () => {
      console.log(`🔌 연결 해제: ${socket.id}`);
      const player = gameManager.getPlayer(playerId);
      if (player && player.roomId) {
        const room = gameManager.getRoom(player.roomId);
        gameManager.leaveRoom(player.roomId, playerId);
        if (room && room.players.length > 0) {
          broadcastRoomState(io, room);
        }
        io.emit('room:listUpdate', gameManager.getRoomList());
      }
      gameManager.players.delete(playerId);
    });
  });
}

/** 방의 모든 플레이어에게 개인화된 상태 전송 */
function broadcastRoomState(io, room) {
  for (const player of room.players) {
    const state = room.getStateForPlayer(player.id);
    io.to(player.id).emit('game:stateUpdate', state);
  }
}

module.exports = { setupSocketHandlers };
