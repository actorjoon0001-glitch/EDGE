/**
 * rooms.js - 방 관련 REST API 라우트
 * 방 목록 조회 등 비실시간 API
 */
const express = require('express');
const router = express.Router();
const { gameManager } = require('../game/GameManager');

// 방 목록 조회
router.get('/', (req, res) => {
  const rooms = gameManager.getRoomList();
  res.json({ success: true, rooms });
});

// 방 상세 조회
router.get('/:id', (req, res) => {
  const room = gameManager.getRoom(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다' });
  }
  res.json({ success: true, room: room.getRoomInfo() });
});

module.exports = router;
