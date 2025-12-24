/**
 * 🀄 Game Store 測試
 * 
 * 測試 Zustand store 嘅各種操作
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

// Reset store before each test
beforeEach(() => {
    useGameStore.setState({
        settings: {
            ruleSetId: 'cantonese',
            scoringConfig: {
                baseScore: 1,
                minFan: 3,
                maxFan: 13,
                startingScore: 500,
                variant: 'standard',
                paymentMode: 'full',
                escalationMode: 'double',
            },
            playerNames: ['東', '南', '西', '北'],
            startingScore: 500,
        },
        game: null,
        winFlow: null,
        preferredInputMode: 'pro',
    });
});

// ============================================
// Game Control Tests
// ============================================

describe('遊戲控制', () => {
    it('應該可以開始新遊戲', () => {
        const { startGame, game } = useGameStore.getState();

        expect(game).toBeNull();

        startGame();

        const state = useGameStore.getState();
        expect(state.game).not.toBeNull();
        expect(state.game?.players.length).toBe(4);
        expect(state.game?.dealerSeatIndex).toBe(0);
        expect(state.game?.roundWind).toBe('east');
        expect(state.game?.roundNumber).toBe(1);
    });

    it('應該可以用自訂設定開始遊戲', () => {
        const { startGame } = useGameStore.getState();

        startGame({
            playerNames: ['阿明', '阿強', '阿偉', '阿輝'],
            startingScore: 1000,
        });

        const state = useGameStore.getState();
        expect(state.game?.players[0].name).toBe('阿明');
        expect(state.game?.players[0].score).toBe(1000);
    });

    it('應該可以結束遊戲', () => {
        const { startGame, endGame } = useGameStore.getState();

        startGame();
        expect(useGameStore.getState().game).not.toBeNull();

        endGame();
        expect(useGameStore.getState().game).toBeNull();
    });

    it('應該可以重置遊戲', () => {
        const store = useGameStore.getState();
        store.startGame();

        // 記錄一局
        const game = useGameStore.getState().game!;
        const mockResult = {
            totalFan: 5,
            basePoints: 32,
            fanDescription: '小三元',
            changes: [
                { playerId: game.players[0].id, delta: 96, newScore: 596 },
                { playerId: game.players[1].id, delta: -32, newScore: 468 },
                { playerId: game.players[2].id, delta: -32, newScore: 468 },
                { playerId: game.players[3].id, delta: -32, newScore: 468 },
            ],
            isDealerWin: true,
        };

        useGameStore.getState().recordWin(mockResult, '小三元');
        expect(useGameStore.getState().game?.history.length).toBe(1);

        // 重置
        useGameStore.getState().resetGame();
        const newState = useGameStore.getState();
        expect(newState.game?.history.length).toBe(0);
        expect(newState.game?.roundNumber).toBe(1);
    });
});

// ============================================
// Round Management Tests
// ============================================

describe('回合管理', () => {
    beforeEach(() => {
        useGameStore.getState().startGame();
    });

    it('記錄莊家贏 - 應該連莊', () => {
        const game = useGameStore.getState().game!;
        const mockResult = {
            totalFan: 5,
            basePoints: 32,
            fanDescription: '對對糊+自摸',
            changes: [
                { playerId: game.players[0].id, delta: 64, newScore: 564 },
                { playerId: game.players[1].id, delta: -32, newScore: 468 },
                { playerId: game.players[2].id, delta: -32, newScore: 468 },
                { playerId: game.players[3].id, delta: -32, newScore: 468 },
            ],
            isDealerWin: true,
        };

        useGameStore.getState().recordWin(mockResult, '對對糊+自摸');

        const state = useGameStore.getState();
        expect(state.game?.dealerSeatIndex).toBe(0); // 仍然係東家做莊
        expect(state.game?.dealerContinueCount).toBe(1); // 連莊 1 次
        expect(state.game?.history.length).toBe(1);
        expect(state.game?.players[0].score).toBe(564);
    });

    it('記錄閒家贏 - 應該換莊', () => {
        const game = useGameStore.getState().game!;
        const mockResult = {
            totalFan: 3,
            basePoints: 8,
            fanDescription: '對對糊',
            changes: [
                { playerId: game.players[0].id, delta: -16, newScore: 484 },
                { playerId: game.players[1].id, delta: 32, newScore: 532 },
                { playerId: game.players[2].id, delta: -8, newScore: 492 },
                { playerId: game.players[3].id, delta: -8, newScore: 492 },
            ],
            isDealerWin: false,
        };

        useGameStore.getState().recordWin(mockResult, '對對糊');

        const state = useGameStore.getState();
        expect(state.game?.dealerSeatIndex).toBe(1); // 換到南家做莊
        expect(state.game?.dealerContinueCount).toBe(0);
        expect(state.game?.roundNumber).toBe(2);
    });

    it('記錄流局 - 應該換莊', () => {
        useGameStore.getState().recordDraw();

        const state = useGameStore.getState();
        expect(state.game?.dealerSeatIndex).toBe(1);
        expect(state.game?.roundNumber).toBe(2);
        expect(state.game?.history[0].outcome.type).toBe('draw');
    });

    it('Undo 應該還原狀態', () => {
        const game = useGameStore.getState().game!;
        const originalScore = game.players[0].score;

        const mockResult = {
            totalFan: 5,
            basePoints: 32,
            fanDescription: '清一色',
            changes: [
                { playerId: game.players[0].id, delta: 64, newScore: 564 },
                { playerId: game.players[1].id, delta: -32, newScore: 468 },
                { playerId: game.players[2].id, delta: -32, newScore: 468 },
                { playerId: game.players[3].id, delta: -32, newScore: 468 },
            ],
            isDealerWin: true,
        };

        useGameStore.getState().recordWin(mockResult, '清一色');
        expect(useGameStore.getState().game?.players[0].score).toBe(564);

        useGameStore.getState().undoLastRound();
        expect(useGameStore.getState().game?.players[0].score).toBe(originalScore);
        expect(useGameStore.getState().game?.history.length).toBe(0);
    });

    it('連續四次換莊應該進入南風圈', () => {
        // 四次閒家贏
        for (let i = 0; i < 4; i++) {
            const game = useGameStore.getState().game!;
            const winnerSeat = (game.dealerSeatIndex + 1) % 4;
            const mockResult = {
                totalFan: 3,
                basePoints: 8,
                fanDescription: '對對糊',
                changes: game.players.map((p, idx) => ({
                    playerId: p.id,
                    delta: idx === winnerSeat ? 24 : -8,
                    newScore: p.score + (idx === winnerSeat ? 24 : -8),
                })),
                isDealerWin: false,
            };
            useGameStore.getState().recordWin(mockResult, '對對糊');
        }

        const state = useGameStore.getState();
        expect(state.game?.roundWind).toBe('south');
    });
});

// ============================================
// Win Flow Tests
// ============================================

describe('食糊流程', () => {
    beforeEach(() => {
        useGameStore.getState().startGame();
    });

    it('應該可以開始 Pro Mode 流程', () => {
        useGameStore.getState().startWinFlow('pro');

        const state = useGameStore.getState();
        expect(state.winFlow).not.toBeNull();
        expect(state.winFlow?.mode).toBe('pro');
        expect(state.winFlow?.step).toBe('select-winner');
    });

    it('應該可以開始 Normal Mode 流程', () => {
        useGameStore.getState().startWinFlow('normal');

        const state = useGameStore.getState();
        expect(state.winFlow?.mode).toBe('normal');
    });

    it('應該可以取消流程', () => {
        useGameStore.getState().startWinFlow();
        expect(useGameStore.getState().winFlow).not.toBeNull();

        useGameStore.getState().cancelWinFlow();
        expect(useGameStore.getState().winFlow).toBeNull();
    });

    it('應該可以更新流程狀態', () => {
        useGameStore.getState().startWinFlow('pro');

        const game = useGameStore.getState().game!;
        useGameStore.getState().updateWinFlow({
            winnerId: game.players[0].id,
        } as any);

        expect(useGameStore.getState().winFlow?.winnerId).toBe(game.players[0].id);
    });
});

// ============================================
// Helper Tests
// ============================================

describe('Helper 函數', () => {
    beforeEach(() => {
        useGameStore.getState().startGame();
    });

    it('getDealer 應該返回正確嘅莊家', () => {
        const dealer = useGameStore.getState().getDealer();
        const game = useGameStore.getState().game!;

        expect(dealer).toBe(game.players[0]);
    });

    it('getPlayerById 應該返回正確嘅玩家', () => {
        const game = useGameStore.getState().game!;
        const player = useGameStore.getState().getPlayerById(game.players[2].id);

        expect(player).toBe(game.players[2]);
    });

    it('getPlayerBySeat 應該返回正確嘅玩家', () => {
        const game = useGameStore.getState().game!;
        const player = useGameStore.getState().getPlayerBySeat(2);

        expect(player).toBe(game.players[2]);
    });

    it('previewScore 應該計算正確嘅分數', () => {
        const game = useGameStore.getState().game!;

        const result = useGameStore.getState().previewScore({
            winnerId: game.players[0].id,
            winType: 'self-draw',
            fanCount: 5,
            description: '測試',
        });

        expect(result).not.toBeNull();
        expect(result?.totalFan).toBe(5);
        expect(result?.basePoints).toBe(32);
    });
});

// ============================================
// Settings Tests
// ============================================

describe('設定', () => {
    it('應該可以更新設定', () => {
        useGameStore.getState().updateSettings({
            startingScore: 1000,
        });

        expect(useGameStore.getState().settings.startingScore).toBe(1000);
    });

    it('應該可以設定偏好輸入模式', () => {
        useGameStore.getState().setPreferredInputMode('normal');
        expect(useGameStore.getState().preferredInputMode).toBe('normal');
    });
});
