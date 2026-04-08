/**
 * auth.js - 인증 관련 REST API 라우트
 * MVP에서는 간단 닉네임 기반 로그인
 * (추후 Supabase Auth로 확장 가능)
 */
const express = require('express');
const router = express.Router();

// 간단한 닉네임 검증
router.post('/login', (req, res) => {
  const { nickname } = req.body;

  if (!nickname || nickname.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: '닉네임은 2자 이상이어야 합니다',
    });
  }

  if (nickname.trim().length > 10) {
    return res.status(400).json({
      success: false,
      error: '닉네임은 10자 이하여야 합니다',
    });
  }

  res.json({
    success: true,
    message: '로그인 성공',
    nickname: nickname.trim(),
  });
});

module.exports = router;
