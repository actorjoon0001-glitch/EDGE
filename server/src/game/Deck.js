/**
 * Deck.js - 카드 덱 관리
 * 52장의 표준 포커 덱 생성, 셔플, 딜 처리
 */

// 카드 슈트 (문양)
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// 카드 랭크 (숫자) - 2부터 14(Ace)
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// 랭크 표시명
const RANK_NAMES = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

// 슈트 기호
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  /** 52장 덱 초기화 */
  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({
          suit,
          rank,
          name: RANK_NAMES[rank],
          symbol: SUIT_SYMBOLS[suit],
          display: `${RANK_NAMES[rank]}${SUIT_SYMBOLS[suit]}`,
        });
      }
    }
    return this;
  }

  /** Fisher-Yates 셔플 알고리즘 */
  shuffle() {
    const cards = this.cards;
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return this;
  }

  /** 카드 1장 뽑기 */
  deal() {
    if (this.cards.length === 0) {
      throw new Error('덱에 카드가 없습니다');
    }
    return this.cards.pop();
  }

  /** 여러 장 뽑기 */
  dealMultiple(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.deal());
    }
    return cards;
  }

  /** 남은 카드 수 */
  remaining() {
    return this.cards.length;
  }
}

module.exports = { Deck, SUITS, RANKS, RANK_NAMES, SUIT_SYMBOLS };
