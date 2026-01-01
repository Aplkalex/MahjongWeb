/**
 * 🀄 Game Store - Zustand 狀態管理
 * 
 * 管理整個麻雀計分 app 嘅狀態：
 * - 遊戲設定
 * - 玩家資料
 * - 回合記錄
 * - 食糊流程
 * 
 * 使用 LocalStorage 做持久化
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    GameState,
    Player,
    Round,
    Wind,
    RuleSetId,
    WinFlowState,
    ScoreResult,
    SeatIndex,
    createPlayers,
    createProModeFlowState,
    createNormalModeFlowState,
    generateId,
    InputMode,
} from '@/lib/engine/types';
import {
    calculateCantoneseScore,
    ScoringConfig,
    DEFAULT_SCORING_CONFIG,
} from '@/lib/engine/cantonese';

// ============================================
// Store Types
// ============================================

interface GameSettings {
    /** 使用嘅牌制 */
    ruleSetId: RuleSetId;
    /** 計分配置 */
    scoringConfig: ScoringConfig;
    /** 玩家名稱 */
    playerNames: [string, string, string, string];
    /** 起始分數 */
    startingScore: number;
}

interface GameStore {
    // ============================================
    // State
    // ============================================

    /** 遊戲設定 */
    settings: GameSettings;

    /** 遊戲狀態（null = 未開始） */
    game: GameState | null;

    /** 食糊流程狀態（null = 冇進行中） */
    winFlow: WinFlowState | null;

    /** 輸入模式偏好 */
    preferredInputMode: InputMode;

    // ============================================
    // Actions - 遊戲控制
    // ============================================

    /** 開始新遊戲 */
    startGame: (settings?: Partial<GameSettings>) => void;

    /** 結束遊戲 */
    endGame: () => void;

    /** 重置遊戲（保留設定） */
    resetGame: () => void;

    // ============================================
    // Actions - 回合管理
    // ============================================

    /** 記錄食糊 */
    recordWin: (result: ScoreResult, description: string) => void;

    /** 記錄流局 */
    recordDraw: () => void;

    /** 下一局（唔計分，唔換莊） */
    nextRound: () => void;

    /** Undo 上一局 */
    undoLastRound: () => void;

    /** 換莊 */
    advanceDealer: () => void;

    // ============================================
    // Actions - 食糊流程
    // ============================================

    /** 開始食糊流程 */
    startWinFlow: (mode?: InputMode) => void;

    /** 取消食糊流程 */
    cancelWinFlow: () => void;

    /** 更新食糊流程狀態 */
    updateWinFlow: (updates: Partial<WinFlowState>) => void;

    /** 設定偏好輸入模式 */
    setPreferredInputMode: (mode: InputMode) => void;

    // ============================================
    // Actions - 設定
    // ============================================

    /** 更新設定 */
    updateSettings: (settings: Partial<GameSettings>) => void;

    /** 更新玩家名稱（唔會 reset 遊戲） */
    updatePlayerName: (seatIndex: SeatIndex, name: string) => void;

    // ============================================
    // Computed / Helpers
    // ============================================

    /** 取得當前莊家 */
    getDealer: () => Player | null;

    /** 取得玩家 by ID */
    getPlayerById: (id: string) => Player | null;

    /** 取得玩家 by 座位 */
    getPlayerBySeat: (seat: SeatIndex) => Player | null;

    /** 計算預覽分數 */
    previewScore: (params: {
        winnerId: string;
        loserId?: string;
        winType: 'self-draw' | 'discard';
        fanCount?: number;
        selectedFanIds?: string[];
        description?: string;
    }) => ScoreResult | null;
}

// ============================================
// Initial State
// ============================================

const DEFAULT_SETTINGS: GameSettings = {
    ruleSetId: 'cantonese',
    scoringConfig: DEFAULT_SCORING_CONFIG,
    playerNames: ['東', '南', '西', '北'],
    startingScore: 500,
};

// ============================================
// Wind Rotation
// ============================================

const WINDS: Wind[] = ['east', 'south', 'west', 'north'];

function getNextWind(current: Wind): Wind {
    const index = WINDS.indexOf(current);
    return WINDS[(index + 1) % 4];
}

function getNextSeat(current: SeatIndex): SeatIndex {
    return ((current + 1) % 4) as SeatIndex;
}

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            // ============================================
            // Initial State
            // ============================================
            settings: DEFAULT_SETTINGS,
            game: null,
            winFlow: null,
            preferredInputMode: 'pro',

            // ============================================
            // Actions - 遊戲控制
            // ============================================

            startGame: (overrides) => {
                const settings = { ...get().settings, ...overrides };
                const players = createPlayers(
                    settings.playerNames,
                    settings.startingScore
                );

                set({
                    settings,
                    game: {
                        id: generateId(),
                        ruleSetId: settings.ruleSetId,
                        players,
                        dealerSeatIndex: 0 as SeatIndex,
                        roundWind: 'east',
                        roundNumber: 1,
                        dealerContinueCount: 0,
                        history: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                    winFlow: null,
                });
            },

            endGame: () => {
                set({
                    game: null,
                    winFlow: null,
                });
            },

            resetGame: () => {
                get().startGame();
            },

            // ============================================
            // Actions - 回合管理
            // ============================================

            recordWin: (result, description) => {
                const { game } = get();
                if (!game) return;

                // 更新玩家分數
                const updatedPlayers = game.players.map((player) => {
                    const change = result.changes.find((c) => c.playerId === player.id);
                    if (change) {
                        return { ...player, score: change.newScore };
                    }
                    return player;
                }) as [Player, Player, Player, Player];

                // 建立回合記錄
                const round: Round = {
                    id: generateId(),
                    roundNumber: game.roundNumber,
                    roundWind: game.roundWind,
                    dealerSeatIndex: game.dealerSeatIndex,
                    outcome: {
                        type: 'win',
                        result,
                    },
                    timestamp: Date.now(),
                };

                // 判斷係咪莊家贏
                const dealerWon = result.isDealerWin;

                // 更新遊戲狀態
                let newDealerSeatIndex = game.dealerSeatIndex;
                let newRoundWind = game.roundWind;
                let newRoundNumber = game.roundNumber;
                let newDealerContinueCount = game.dealerContinueCount;

                if (dealerWon) {
                    // 莊家贏：連莊
                    newDealerContinueCount += 1;
                } else {
                    // 閒家贏：換莊
                    newDealerSeatIndex = getNextSeat(game.dealerSeatIndex);
                    newDealerContinueCount = 0;

                    // 如果換到東家（seat 0），進入下一圈
                    if (newDealerSeatIndex === 0) {
                        newRoundWind = getNextWind(game.roundWind);
                    }

                    newRoundNumber += 1;
                }

                set({
                    game: {
                        ...game,
                        players: updatedPlayers,
                        dealerSeatIndex: newDealerSeatIndex,
                        roundWind: newRoundWind,
                        roundNumber: newRoundNumber,
                        dealerContinueCount: newDealerContinueCount,
                        history: [...game.history, round],
                        updatedAt: Date.now(),
                    },
                    winFlow: null,
                });
            },

            recordDraw: () => {
                const { game } = get();
                if (!game) return;

                const round: Round = {
                    id: generateId(),
                    roundNumber: game.roundNumber,
                    roundWind: game.roundWind,
                    dealerSeatIndex: game.dealerSeatIndex,
                    outcome: { type: 'draw' },
                    timestamp: Date.now(),
                };

                // 流局：換莊
                const newDealerSeatIndex = getNextSeat(game.dealerSeatIndex);
                let newRoundWind = game.roundWind;

                if (newDealerSeatIndex === 0) {
                    newRoundWind = getNextWind(game.roundWind);
                }

                set({
                    game: {
                        ...game,
                        dealerSeatIndex: newDealerSeatIndex,
                        roundWind: newRoundWind,
                        roundNumber: game.roundNumber + 1,
                        dealerContinueCount: 0,
                        history: [...game.history, round],
                        updatedAt: Date.now(),
                    },
                });
            },

            nextRound: () => {
                const { game } = get();
                if (!game) return;

                set({
                    game: {
                        ...game,
                        roundNumber: game.roundNumber + 1,
                        dealerContinueCount: 0,
                        updatedAt: Date.now(),
                    },
                });
            },

            undoLastRound: () => {
                const { game } = get();
                if (!game || game.history.length === 0) return;

                const lastRound = game.history[game.history.length - 1];

                // 還原玩家分數
                let restoredPlayers = game.players;
                if (lastRound.outcome.type === 'win') {
                    restoredPlayers = game.players.map((player) => {
                        const change = lastRound.outcome.type === 'win'
                            ? lastRound.outcome.result.changes.find((c) => c.playerId === player.id)
                            : null;
                        if (change) {
                            return { ...player, score: player.score - change.delta };
                        }
                        return player;
                    }) as [Player, Player, Player, Player];
                }

                set({
                    game: {
                        ...game,
                        players: restoredPlayers,
                        dealerSeatIndex: lastRound.dealerSeatIndex,
                        roundWind: lastRound.roundWind,
                        roundNumber: lastRound.roundNumber,
                        history: game.history.slice(0, -1),
                        updatedAt: Date.now(),
                    },
                });
            },

            advanceDealer: () => {
                const { game } = get();
                if (!game) return;

                const newDealerSeatIndex = getNextSeat(game.dealerSeatIndex);
                let newRoundWind = game.roundWind;

                if (newDealerSeatIndex === 0) {
                    newRoundWind = getNextWind(game.roundWind);
                }

                set({
                    game: {
                        ...game,
                        dealerSeatIndex: newDealerSeatIndex,
                        roundWind: newRoundWind,
                        dealerContinueCount: 0,
                        updatedAt: Date.now(),
                    },
                });
            },

            // ============================================
            // Actions - 食糊流程
            // ============================================

            startWinFlow: (mode) => {
                const inputMode = mode || get().preferredInputMode;
                set({
                    winFlow: inputMode === 'pro'
                        ? createProModeFlowState()
                        : createNormalModeFlowState(),
                });
            },

            cancelWinFlow: () => {
                set({ winFlow: null });
            },

            updateWinFlow: (updates) => {
                const { winFlow } = get();
                if (!winFlow) return;

                set({
                    winFlow: { ...winFlow, ...updates } as WinFlowState,
                });
            },

            setPreferredInputMode: (mode) => {
                set({ preferredInputMode: mode });
            },

            // ============================================
            // Actions - 設定
            // ============================================

            updateSettings: (updates) => {
                set({
                    settings: { ...get().settings, ...updates },
                });
            },

            updatePlayerName: (seatIndex, name) => {
                const { game, settings } = get();
                
                // Update settings
                const newNames = [...settings.playerNames] as [string, string, string, string];
                newNames[seatIndex] = name;
                
                // Update game if exists
                if (game) {
                    const updatedPlayers = game.players.map((p, i) => 
                        i === seatIndex ? { ...p, name } : p
                    ) as typeof game.players;
                    
                    set({
                        settings: { ...settings, playerNames: newNames },
                        game: { ...game, players: updatedPlayers, updatedAt: Date.now() },
                    });
                } else {
                    set({
                        settings: { ...settings, playerNames: newNames },
                    });
                }
            },

            // ============================================
            // Computed / Helpers
            // ============================================

            getDealer: () => {
                const { game } = get();
                if (!game) return null;
                return game.players[game.dealerSeatIndex];
            },

            getPlayerById: (id) => {
                const { game } = get();
                if (!game) return null;
                return game.players.find((p) => p.id === id) || null;
            },

            getPlayerBySeat: (seat) => {
                const { game } = get();
                if (!game) return null;
                return game.players[seat];
            },

            previewScore: (params) => {
                const { game, settings } = get();
                if (!game) return null;

                const { winnerId, loserId, winType, fanCount, selectedFanIds, description } = params;
                const dealerId = game.players[game.dealerSeatIndex].id;

                if (fanCount !== undefined) {
                    // Pro Mode
                    return calculateCantoneseScore({
                        mode: 'pro',
                        winType,
                        winnerId,
                        loserId,
                        fanCount,
                        description,
                        players: game.players,
                        dealerId,
                    }, settings.scoringConfig);
                } else if (selectedFanIds) {
                    // Normal Mode
                    return calculateCantoneseScore({
                        mode: 'normal',
                        winType,
                        winnerId,
                        loserId,
                        selectedFanIds,
                        players: game.players,
                        dealerId,
                    }, settings.scoringConfig);
                }

                return null;
            },
        }),
        {
            name: 'mahjong-game-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                settings: state.settings,
                game: state.game,
                preferredInputMode: state.preferredInputMode,
            }),
        }
    )
);

// ============================================
// Selectors (for performance)
// ============================================

export const selectPlayers = (state: GameStore) => state.game?.players ?? [];
export const selectDealer = (state: GameStore) => {
    const game = state.game;
    if (!game) return null;
    return game.players[game.dealerSeatIndex];
};
export const selectHistory = (state: GameStore) => state.game?.history ?? [];
export const selectIsGameActive = (state: GameStore) => state.game !== null;
export const selectWinFlow = (state: GameStore) => state.winFlow;
export const selectSettings = (state: GameStore) => state.settings;
export const selectDealerSeatIndex = (state: GameStore) => state.game?.dealerSeatIndex ?? 0;
export const selectRoundWind = (state: GameStore) => state.game?.roundWind ?? 'east';
export const selectRoundNumber = (state: GameStore) => state.game?.roundNumber ?? 1;
