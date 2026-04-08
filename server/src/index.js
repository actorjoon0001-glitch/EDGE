/**
 * EDGE HOLDEM - 메인 서버 진입점
 * Express + Socket.IO 기반 실시간 포커 게임 서버
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { setupSocketHandlers } = require('./socket/socketHandler');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// CORS 설정
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// REST API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', game: 'EDGE HOLDEM' });
});

// 소켓 핸들러 연결
setupSocketHandlers(io);

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🃏 EDGE HOLDEM 서버 실행 중: http://localhost:${PORT}`);
});
