/**
 * cardUtils.js - 카드 관련 유틸리티
 * 카드 렌더링에 필요한 헬퍼 함수들
 */

/** 슈트별 색상 (빨간색 / 검정색) */
export function getSuitColor(suit) {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900';
}

/** 슈트 기호 */
export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

/** 슈트 이모지 (큰 표시용) */
export const SUIT_EMOJI = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

/** 랭크 표시명 */
export const RANK_DISPLAY = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

/** 숫자를 칩 표시 형식으로 포맷 */
export function formatChips(amount) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
}

/** 페이즈 한글명 */
export const PHASE_NAMES = {
  waiting: '대기 중',
  preflop: '프리플랍',
  flop: '플랍',
  turn: '턴',
  river: '리버',
  showdown: '쇼다운',
};
