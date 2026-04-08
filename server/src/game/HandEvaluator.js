/**
 * HandEvaluator.js - 포커 핸드 판정기
 * 7장(홀카드 2장 + 커뮤니티 5장)에서 최고의 5장 조합을 찾아 랭킹 판정
 *
 * 핸드 랭킹 (높은 순):
 * 10: 로열 플러시    - A,K,Q,J,10 같은 문양
 *  9: 스트레이트 플러시 - 연속 5장 같은 문양
 *  8: 포카드         - 같은 숫자 4장
 *  7: 풀하우스       - 트리플 + 페어
 *  6: 플러시         - 같은 문양 5장
 *  5: 스트레이트     - 연속 5장
 *  4: 트리플         - 같은 숫자 3장
 *  3: 투페어         - 페어 2개
 *  2: 원페어         - 같은 숫자 2장
 *  1: 하이카드       - 위 해당 없음
 */

const HAND_NAMES = {
  10: '로열 플러시',
  9: '스트레이트 플러시',
  8: '포카드',
  7: '풀하우스',
  6: '플러시',
  5: '스트레이트',
  4: '트리플',
  3: '투페어',
  2: '원페어',
  1: '하이카드',
};

class HandEvaluator {
  /**
   * 7장에서 가능한 모든 5장 조합을 만들어 최고 핸드 반환
   * @param {Array} cards - 7장의 카드 배열
   * @returns {{ rank, name, bestCards, kickers }}
   */
  static evaluate(cards) {
    if (cards.length < 5) {
      throw new Error('최소 5장의 카드가 필요합니다');
    }

    const combinations = HandEvaluator.getCombinations(cards, 5);
    let bestHand = null;

    for (const combo of combinations) {
      const hand = HandEvaluator.evaluateFive(combo);
      if (!bestHand || HandEvaluator.compareHands(hand, bestHand) > 0) {
        bestHand = hand;
      }
    }

    return bestHand;
  }

  /**
   * 정확히 5장의 핸드를 평가
   * @param {Array} cards - 5장의 카드
   * @returns {{ rank, name, values, bestCards }}
   */
  static evaluateFive(cards) {
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map((c) => c.rank);
    const suits = sorted.map((c) => c.suit);

    const isFlush = suits.every((s) => s === suits[0]);
    const isStraight = HandEvaluator.isStraight(ranks);

    // Ace-low 스트레이트 체크 (A,2,3,4,5)
    const isLowStraight = HandEvaluator.isLowStraight(ranks);

    const rankCounts = {};
    for (const r of ranks) {
      rankCounts[r] = (rankCounts[r] || 0) + 1;
    }
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // 로열 플러시
    if (isFlush && isStraight && ranks[0] === 14) {
      return { rank: 10, name: HAND_NAMES[10], values: ranks, bestCards: sorted };
    }

    // 스트레이트 플러시
    if (isFlush && (isStraight || isLowStraight)) {
      const values = isLowStraight ? [5, 4, 3, 2, 1] : ranks;
      return { rank: 9, name: HAND_NAMES[9], values, bestCards: sorted };
    }

    // 포카드
    if (counts[0] === 4) {
      const quadRank = Number(Object.keys(rankCounts).find((k) => rankCounts[k] === 4));
      const kicker = ranks.find((r) => r !== quadRank);
      return { rank: 8, name: HAND_NAMES[8], values: [quadRank, kicker], bestCards: sorted };
    }

    // 풀하우스
    if (counts[0] === 3 && counts[1] === 2) {
      const tripleRank = Number(Object.keys(rankCounts).find((k) => rankCounts[k] === 3));
      const pairRank = Number(Object.keys(rankCounts).find((k) => rankCounts[k] === 2));
      return { rank: 7, name: HAND_NAMES[7], values: [tripleRank, pairRank], bestCards: sorted };
    }

    // 플러시
    if (isFlush) {
      return { rank: 6, name: HAND_NAMES[6], values: ranks, bestCards: sorted };
    }

    // 스트레이트
    if (isStraight || isLowStraight) {
      const values = isLowStraight ? [5, 4, 3, 2, 1] : ranks;
      return { rank: 5, name: HAND_NAMES[5], values, bestCards: sorted };
    }

    // 트리플
    if (counts[0] === 3) {
      const tripleRank = Number(Object.keys(rankCounts).find((k) => rankCounts[k] === 3));
      const kickers = ranks.filter((r) => r !== tripleRank);
      return { rank: 4, name: HAND_NAMES[4], values: [tripleRank, ...kickers], bestCards: sorted };
    }

    // 투페어
    if (counts[0] === 2 && counts[1] === 2) {
      const pairs = Object.keys(rankCounts)
        .filter((k) => rankCounts[k] === 2)
        .map(Number)
        .sort((a, b) => b - a);
      const kicker = ranks.find((r) => !pairs.includes(r));
      return { rank: 3, name: HAND_NAMES[3], values: [...pairs, kicker], bestCards: sorted };
    }

    // 원페어
    if (counts[0] === 2) {
      const pairRank = Number(Object.keys(rankCounts).find((k) => rankCounts[k] === 2));
      const kickers = ranks.filter((r) => r !== pairRank);
      return { rank: 2, name: HAND_NAMES[2], values: [pairRank, ...kickers], bestCards: sorted };
    }

    // 하이카드
    return { rank: 1, name: HAND_NAMES[1], values: ranks, bestCards: sorted };
  }

  /** 연속 5장인지 확인 */
  static isStraight(ranks) {
    for (let i = 0; i < ranks.length - 1; i++) {
      if (ranks[i] - ranks[i + 1] !== 1) return false;
    }
    return true;
  }

  /** A-low 스트레이트(A,2,3,4,5) 확인 */
  static isLowStraight(ranks) {
    const low = [14, 5, 4, 3, 2];
    return ranks.length === 5 && ranks.every((r, i) => r === low[i]);
  }

  /**
   * 두 핸드 비교
   * @returns 양수(hand1 승), 음수(hand2 승), 0(동점)
   */
  static compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
      return hand1.rank - hand2.rank;
    }

    // 같은 랭크면 values 비교 (키커 포함)
    for (let i = 0; i < hand1.values.length; i++) {
      if (hand1.values[i] !== hand2.values[i]) {
        return hand1.values[i] - hand2.values[i];
      }
    }

    return 0; // 완전 동점
  }

  /** 승자 결정 (동점 시 팟 분배 지원) */
  static determineWinners(playerHands) {
    if (playerHands.length === 0) return [];

    // 각 플레이어의 핸드 평가
    const evaluated = playerHands.map((ph) => ({
      playerId: ph.playerId,
      hand: HandEvaluator.evaluate(ph.cards),
    }));

    // 최고 핸드 찾기
    let best = evaluated[0];
    for (let i = 1; i < evaluated.length; i++) {
      if (HandEvaluator.compareHands(evaluated[i].hand, best.hand) > 0) {
        best = evaluated[i];
      }
    }

    // 동점자 모두 찾기 (팟 스플릿)
    const winners = evaluated.filter(
      (e) => HandEvaluator.compareHands(e.hand, best.hand) === 0
    );

    return winners.map((w) => ({
      playerId: w.playerId,
      hand: w.hand,
    }));
  }

  /** nCr 조합 생성 */
  static getCombinations(arr, size) {
    const result = [];

    function combine(start, combo) {
      if (combo.length === size) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    }

    combine(0, []);
    return result;
  }
}

module.exports = { HandEvaluator, HAND_NAMES };
