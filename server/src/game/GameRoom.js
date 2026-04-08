/**
 * GameRoom.js - 개별 게임 방 관리
 * 한 방의 전체 게임 상태와 로직을 관리한다.
 *
 * 게임 흐름:
 * 1. 프리플랍 - 홀카드 2장 배분, 첫 베팅
 * 2. 플랍     - 커뮤니티 카드 3장 오픈, 베팅
 * 3. 턴       - 커뮤니티 카드 1장 추가, 베팅
 * 4. 리버     - 커뮤니티 카드 1장 추가, 베팅
 * 5. 쇼다운   - 핸드 비교, 승자 결정
 */
const { Deck } = require('./Deck');
const { HandEvaluator } = require('./HandEvaluator');

// 게임 페이즈 상수
const PHASES = {
  WAITING: 'waiting',       // 대기 중
  PREFLOP: 'preflop',       // 프리플랍
  FLOP: 'flop',             // 플랍
  TURN: 'turn',             // 턴
  RIVER: 'river',           // 리버
  SHOWDOWN: 'showdown',     // 쇼다운
};

// 기본 블라인드
const DEFAULT_SMALL_BLIND = 50;
const DEFAULT_BIG_BLIND = 100;

class GameRoom {
  /**
   * @param {string} id - 방 ID
   * @param {object} options - 방 설정
   */
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Room ${id.slice(0, 6)}`;
    this.maxPlayers = Math.min(options.maxPlayers || 6, 6);
    this.smallBlind = options.smallBlind || DEFAULT_SMALL_BLIND;
    this.bigBlind = options.bigBlind || DEFAULT_BIG_BLIND;

    // 플레이어 관리
    this.players = [];          // { id, nickname, chips, holeCards, bet, folded, allIn, seatIndex }
    this.creatorId = options.creatorId || null;

    // 게임 상태
    this.phase = PHASES.WAITING;
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;        // 현재 라운드 최대 베팅액
    this.currentPlayerIndex = 0;// 현재 턴 플레이어 인덱스
    this.dealerIndex = 0;       // 딜러 위치
    this.lastRaiserIndex = -1;  // 마지막 레이즈한 플레이어

    // 게임 로그
    this.logs = [];
  }

  /** 플레이어 추가 */
  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: '방이 가득 찼습니다' };
    }
    if (this.players.find((p) => p.id === player.id)) {
      return { success: false, error: '이미 참가한 플레이어입니다' };
    }

    // 빈 좌석 찾기
    const takenSeats = new Set(this.players.map((p) => p.seatIndex));
    let seatIndex = 0;
    while (takenSeats.has(seatIndex)) seatIndex++;

    const newPlayer = {
      id: player.id,
      nickname: player.nickname,
      chips: player.chips || 10000,  // 기본 시작 칩
      holeCards: [],
      bet: 0,
      totalBet: 0,        // 이번 핸드 전체 베팅액
      folded: false,
      allIn: false,
      seatIndex,
      isConnected: true,
    };

    this.players.push(newPlayer);
    this.addLog(`${player.nickname}님이 입장했습니다`);
    return { success: true, player: newPlayer };
  }

  /** 플레이어 제거 */
  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) return false;

    const player = this.players[index];
    this.addLog(`${player.nickname}님이 퇴장했습니다`);
    this.players.splice(index, 1);

    // 게임 중이면 폴드 처리
    if (this.phase !== PHASES.WAITING) {
      this.checkGameEnd();
    }

    return true;
  }

  /** 게임 시작 */
  startGame() {
    if (this.players.length < 2) {
      return { success: false, error: '최소 2명이 필요합니다' };
    }

    // 초기화
    this.deck.reset().shuffle();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.logs = [];

    // 플레이어 상태 초기화
    for (const p of this.players) {
      p.holeCards = [];
      p.bet = 0;
      p.totalBet = 0;
      p.folded = false;
      p.allIn = false;
    }

    // 딜러 이동
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    // 블라인드 처리
    this.postBlinds();

    // 홀카드 분배 (각 2장)
    for (const p of this.players) {
      p.holeCards = this.deck.dealMultiple(2);
    }

    this.phase = PHASES.PREFLOP;

    // 빅블라인드 다음 사람부터 시작
    const bbIndex = (this.dealerIndex + (this.players.length === 2 ? 0 : 2)) % this.players.length;
    this.currentPlayerIndex = (bbIndex + 1) % this.players.length;
    this.skipFoldedPlayers();

    this.addLog('게임이 시작되었습니다!');
    return { success: true };
  }

  /** 블라인드 베팅 */
  postBlinds() {
    const playerCount = this.players.length;

    // 헤즈업(2인): 딜러=SB, 상대=BB
    // 3인 이상: 딜러 왼쪽=SB, 그 왼쪽=BB
    let sbIndex, bbIndex;
    if (playerCount === 2) {
      sbIndex = this.dealerIndex;
      bbIndex = (this.dealerIndex + 1) % playerCount;
    } else {
      sbIndex = (this.dealerIndex + 1) % playerCount;
      bbIndex = (this.dealerIndex + 2) % playerCount;
    }

    // 스몰 블라인드
    const sbPlayer = this.players[sbIndex];
    const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
    sbPlayer.chips -= sbAmount;
    sbPlayer.bet = sbAmount;
    sbPlayer.totalBet = sbAmount;
    this.pot += sbAmount;
    if (sbPlayer.chips === 0) sbPlayer.allIn = true;

    // 빅 블라인드
    const bbPlayer = this.players[bbIndex];
    const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
    bbPlayer.chips -= bbAmount;
    bbPlayer.bet = bbAmount;
    bbPlayer.totalBet = bbAmount;
    this.pot += bbAmount;
    this.currentBet = bbAmount;
    if (bbPlayer.chips === 0) bbPlayer.allIn = true;

    this.lastRaiserIndex = bbIndex;

    this.addLog(`${sbPlayer.nickname}: SB ${sbAmount}`);
    this.addLog(`${bbPlayer.nickname}: BB ${bbAmount}`);
  }

  /**
   * 플레이어 액션 처리
   * @param {string} playerId
   * @param {string} action - 'check', 'call', 'raise', 'fold', 'allIn'
   * @param {number} amount - 레이즈 금액 (레이즈 시에만)
   */
  handleAction(playerId, action, amount = 0) {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    }
    if (playerIndex !== this.currentPlayerIndex) {
      return { success: false, error: '당신의 턴이 아닙니다' };
    }

    const player = this.players[playerIndex];
    if (player.folded || player.allIn) {
      return { success: false, error: '액션을 수행할 수 없습니다' };
    }

    switch (action) {
      case 'fold':
        return this.handleFold(player);
      case 'check':
        return this.handleCheck(player);
      case 'call':
        return this.handleCall(player);
      case 'raise':
        return this.handleRaise(player, amount);
      case 'allIn':
        return this.handleAllIn(player);
      default:
        return { success: false, error: '알 수 없는 액션입니다' };
    }
  }

  /** 폴드 */
  handleFold(player) {
    player.folded = true;
    this.addLog(`${player.nickname}: 폴드`);

    // 1명만 남으면 즉시 승리
    const activePlayers = this.players.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      return this.endGameEarly(activePlayers[0]);
    }

    this.advanceTurn();
    return { success: true, action: 'fold' };
  }

  /** 체크 */
  handleCheck(player) {
    if (player.bet < this.currentBet) {
      return { success: false, error: '체크할 수 없습니다. 콜 또는 레이즈해야 합니다.' };
    }

    this.addLog(`${player.nickname}: 체크`);
    this.advanceTurn();
    return { success: true, action: 'check' };
  }

  /** 콜 */
  handleCall(player) {
    const callAmount = Math.min(this.currentBet - player.bet, player.chips);

    player.chips -= callAmount;
    player.bet += callAmount;
    player.totalBet += callAmount;
    this.pot += callAmount;

    if (player.chips === 0) {
      player.allIn = true;
      this.addLog(`${player.nickname}: 올인 (콜 ${callAmount})`);
    } else {
      this.addLog(`${player.nickname}: 콜 ${callAmount}`);
    }

    this.advanceTurn();
    return { success: true, action: 'call', amount: callAmount };
  }

  /** 레이즈 */
  handleRaise(player, raiseAmount) {
    const minRaise = this.currentBet + this.bigBlind;
    const totalNeeded = raiseAmount - player.bet;

    if (raiseAmount < minRaise && totalNeeded < player.chips) {
      return { success: false, error: `최소 레이즈: ${minRaise}` };
    }

    const actualAmount = Math.min(totalNeeded, player.chips);
    player.chips -= actualAmount;
    player.bet += actualAmount;
    player.totalBet += actualAmount;
    this.pot += actualAmount;
    this.currentBet = player.bet;
    this.lastRaiserIndex = this.currentPlayerIndex;

    if (player.chips === 0) {
      player.allIn = true;
      this.addLog(`${player.nickname}: 올인 레이즈 ${player.bet}`);
    } else {
      this.addLog(`${player.nickname}: 레이즈 ${player.bet}`);
    }

    this.advanceTurn();
    return { success: true, action: 'raise', amount: player.bet };
  }

  /** 올인 */
  handleAllIn(player) {
    const allInAmount = player.chips;
    player.bet += allInAmount;
    player.totalBet += allInAmount;
    this.pot += allInAmount;
    player.chips = 0;
    player.allIn = true;

    if (player.bet > this.currentBet) {
      this.currentBet = player.bet;
      this.lastRaiserIndex = this.currentPlayerIndex;
    }

    this.addLog(`${player.nickname}: 올인! ${player.bet}`);
    this.advanceTurn();
    return { success: true, action: 'allIn', amount: allInAmount };
  }

  /** 턴 넘기기 */
  advanceTurn() {
    const activePlayers = this.players.filter((p) => !p.folded && !p.allIn);

    // 액션 가능한 플레이어가 0~1명이면 자동 진행
    if (activePlayers.length <= 1) {
      // 모든 플레이어가 폴드/올인이면 남은 카드를 오픈하고 쇼다운
      const nonFolded = this.players.filter((p) => !p.folded);
      if (nonFolded.length === 1) {
        this.endGameEarly(nonFolded[0]);
        return;
      }
      // 올인 런아웃: 남은 커뮤니티 카드를 모두 오픈
      this.runOutCommunityCards();
      this.showdown();
      return;
    }

    // 다음 플레이어 찾기
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let loopCount = 0;

    while (loopCount < this.players.length) {
      const nextPlayer = this.players[nextIndex];
      if (!nextPlayer.folded && !nextPlayer.allIn) {
        break;
      }
      nextIndex = (nextIndex + 1) % this.players.length;
      loopCount++;
    }

    // 라운드 완료 확인: 모든 액티브 플레이어의 베팅이 같으면
    if (this.isRoundComplete(nextIndex)) {
      this.advancePhase();
    } else {
      this.currentPlayerIndex = nextIndex;
    }
  }

  /** 현재 베팅 라운드가 완료되었는지 확인 */
  isRoundComplete(nextIndex) {
    // 마지막 레이즈한 사람에게 돌아왔으면 라운드 종료
    if (nextIndex === this.lastRaiserIndex) {
      return true;
    }

    // 모든 액티브 플레이어의 베팅이 같은지 확인
    const activePlayers = this.players.filter((p) => !p.folded && !p.allIn);
    if (activePlayers.length === 0) return true;

    const allSameBet = activePlayers.every((p) => p.bet === this.currentBet);
    if (allSameBet && nextIndex === this.lastRaiserIndex) {
      return true;
    }

    return false;
  }

  /** 폴드/올인 플레이어 건너뛰기 */
  skipFoldedPlayers() {
    let attempts = 0;
    while (attempts < this.players.length) {
      const p = this.players[this.currentPlayerIndex];
      if (!p.folded && !p.allIn) break;
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
    }
  }

  /** 다음 페이즈로 진행 */
  advancePhase() {
    // 베팅 리셋
    for (const p of this.players) {
      p.bet = 0;
    }
    this.currentBet = 0;
    this.lastRaiserIndex = -1;

    switch (this.phase) {
      case PHASES.PREFLOP:
        // 플랍: 커뮤니티 카드 3장
        this.communityCards = this.deck.dealMultiple(3);
        this.phase = PHASES.FLOP;
        this.addLog(`== 플랍 == ${this.communityCards.map((c) => c.display).join(' ')}`);
        break;

      case PHASES.FLOP:
        // 턴: 커뮤니티 카드 1장 추가
        this.communityCards.push(this.deck.deal());
        this.phase = PHASES.TURN;
        this.addLog(`== 턴 == ${this.communityCards[3].display}`);
        break;

      case PHASES.TURN:
        // 리버: 커뮤니티 카드 1장 추가
        this.communityCards.push(this.deck.deal());
        this.phase = PHASES.RIVER;
        this.addLog(`== 리버 == ${this.communityCards[4].display}`);
        break;

      case PHASES.RIVER:
        // 쇼다운
        this.showdown();
        return;
    }

    // 딜러 왼쪽부터 시작 (헤즈업은 딜러부터)
    if (this.players.length === 2) {
      this.currentPlayerIndex = this.dealerIndex;
    } else {
      this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
    }
    this.skipFoldedPlayers();

    // 첫 액션 플레이어를 lastRaiser로 설정 (라운드 종료 기준)
    this.lastRaiserIndex = this.currentPlayerIndex;
  }

  /** 올인 런아웃 - 남은 커뮤니티 카드를 모두 오픈 */
  runOutCommunityCards() {
    while (this.communityCards.length < 5) {
      this.communityCards.push(this.deck.deal());
    }
    if (this.phase === PHASES.PREFLOP) {
      this.addLog(`== 플랍 == ${this.communityCards.slice(0, 3).map((c) => c.display).join(' ')}`);
    }
    if (this.phase !== PHASES.RIVER) {
      this.addLog(`== 커뮤니티 == ${this.communityCards.map((c) => c.display).join(' ')}`);
    }
  }

  /** 쇼다운 - 핸드 비교 및 승자 결정 */
  showdown() {
    this.phase = PHASES.SHOWDOWN;
    this.addLog('== 쇼다운 ==');

    const activePlayers = this.players.filter((p) => !p.folded);
    const playerHands = activePlayers.map((p) => ({
      playerId: p.id,
      cards: [...p.holeCards, ...this.communityCards],
    }));

    const winners = HandEvaluator.determineWinners(playerHands);
    const prizePerWinner = Math.floor(this.pot / winners.length);

    const result = {
      winners: winners.map((w) => {
        const player = this.players.find((p) => p.id === w.playerId);
        player.chips += prizePerWinner;
        return {
          playerId: w.playerId,
          nickname: player.nickname,
          hand: w.hand,
          prize: prizePerWinner,
        };
      }),
      pot: this.pot,
      communityCards: this.communityCards,
      playerHands: activePlayers.map((p) => ({
        playerId: p.id,
        nickname: p.nickname,
        holeCards: p.holeCards,
      })),
    };

    // 나머지 칩 처리 (반올림 차이)
    const remainder = this.pot - prizePerWinner * winners.length;
    if (remainder > 0 && result.winners.length > 0) {
      const firstWinner = this.players.find((p) => p.id === result.winners[0].playerId);
      firstWinner.chips += remainder;
      result.winners[0].prize += remainder;
    }

    for (const w of result.winners) {
      this.addLog(`🏆 ${w.nickname} 승리! ${w.hand.name} - ${w.prize} 칩 획득`);
    }

    this.pot = 0;
    return result;
  }

  /** 얼리 엔드 - 1명 남았을 때 즉시 승리 */
  endGameEarly(winner) {
    this.phase = PHASES.SHOWDOWN;
    winner.chips += this.pot;

    const result = {
      winners: [{
        playerId: winner.id,
        nickname: winner.nickname,
        hand: null,
        prize: this.pot,
      }],
      pot: this.pot,
      communityCards: this.communityCards,
      playerHands: [],
      earlyEnd: true,
    };

    this.addLog(`🏆 ${winner.nickname} 승리! (상대방 폴드) - ${this.pot} 칩 획득`);
    this.pot = 0;
    return result;
  }

  /** 게임 종료 후 남은 플레이어 확인 */
  checkGameEnd() {
    const activePlayers = this.players.filter((p) => !p.folded);
    if (activePlayers.length === 1 && this.phase !== PHASES.WAITING) {
      return this.endGameEarly(activePlayers[0]);
    }
    return null;
  }

  /** 현재 플레이어가 가능한 액션 목록 */
  getAvailableActions(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.folded || player.allIn) return [];

    const isCurrentPlayer = this.players[this.currentPlayerIndex]?.id === playerId;
    if (!isCurrentPlayer) return [];

    const actions = ['fold'];

    if (player.bet >= this.currentBet) {
      actions.push('check');
    } else {
      actions.push('call');
    }

    if (player.chips > 0) {
      actions.push('raise');
      actions.push('allIn');
    }

    return actions;
  }

  /** 특정 플레이어에게 보여줄 게임 상태 (홀카드는 본인만) */
  getStateForPlayer(playerId) {
    return {
      roomId: this.id,
      roomName: this.name,
      phase: this.phase,
      pot: this.pot,
      currentBet: this.currentBet,
      communityCards: this.communityCards,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.players[this.currentPlayerIndex]?.id || null,
      dealerIndex: this.dealerIndex,
      players: this.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        chips: p.chips,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        seatIndex: p.seatIndex,
        isConnected: p.isConnected,
        holeCards: p.id === playerId ? p.holeCards : p.holeCards.map(() => null),
        cardCount: p.holeCards.length,
      })),
      availableActions: this.getAvailableActions(playerId),
      logs: this.logs.slice(-20),
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
    };
  }

  /** 로비에 보여줄 방 정보 */
  getRoomInfo() {
    return {
      id: this.id,
      name: this.name,
      playerCount: this.players.length,
      maxPlayers: this.maxPlayers,
      phase: this.phase,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
    };
  }

  /** 로그 추가 */
  addLog(message) {
    this.logs.push({
      message,
      timestamp: Date.now(),
    });
  }
}

module.exports = { GameRoom, PHASES };
