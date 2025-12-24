/**
 * 🀄 廣東牌計分引擎測試 - 完整版
 *
 * 測試各種計分情景，確保邏輯正確
 * 包括：
 * - Pro Mode / Normal Mode
 * - 清章 / 新章
 * - 完整番種計算
 * - 邊界情況
 * - 效能測試
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateCantoneseScore,
    calculateScoreProMode,
    calculateScoreNormalMode,
    CANTONESE_FAN_TYPES,
    CANTONESE_RULESET,
    DEFAULT_SCORING_CONFIG,
    validateFanCombination,
    getFanById,
    getFansByCategory,
    getCommonFans,
    getStandardFans,
    getCustomFans,
    getLimitFans,
    ScoringConfig,
} from '../cantonese';
import { createPlayers, Player, RuleVariant } from '../types';

// ============================================
// Test Helpers
// ============================================

function createTestPlayers(): [Player, Player, Player, Player] {
    return createPlayers(['東家', '南家', '西家', '北家'], 500);
}

// ============================================
// Fan Type Tests
// ============================================

describe('番種定義', () => {
    it('應該有足夠數量嘅番種', () => {
        expect(CANTONESE_FAN_TYPES.length).toBeGreaterThan(30);
    });

    it('每個番種應該有必要嘅屬性', () => {
        for (const fan of CANTONESE_FAN_TYPES) {
            expect(fan.id).toBeDefined();
            expect(fan.name).toBeDefined();
            expect(fan.nameEn).toBeDefined();
            expect(typeof fan.value).toBe('number');
            expect(fan.category).toBeDefined();
            expect(fan.description).toBeDefined();
        }
    });

    it('每個番種 ID 應該唯一', () => {
        const ids = CANTONESE_FAN_TYPES.map((f) => f.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('互斥番種應該雙向定義', () => {
        const allChows = CANTONESE_FAN_TYPES.find((f) => f.id === 'all-chows');
        const allPungs = CANTONESE_FAN_TYPES.find((f) => f.id === 'all-pungs');

        expect(allChows?.incompatibleWith).toContain('all-pungs');
        expect(allPungs?.incompatibleWith).toContain('all-chows');
    });

    it('應該有正確嘅清章番種', () => {
        const standardFans = getStandardFans();
        expect(standardFans.length).toBeGreaterThan(20);

        const ids = standardFans.map((f) => f.id);
        expect(ids).toContain('all-chows');
        expect(ids).toContain('all-pungs');
        expect(ids).toContain('full-flush');
        expect(ids).toContain('thirteen-orphans');
    });

    it('應該有正確嘅新章番種', () => {
        const customFans = getCustomFans();
        expect(customFans.length).toBeGreaterThan(5);

        const ids = customFans.map((f) => f.id);
        expect(ids).toContain('seven-pairs');
        expect(ids).toContain('straight');
    });

    it('應該可以取得例牌', () => {
        const limitFans = getLimitFans();
        expect(limitFans.length).toBeGreaterThan(5);

        const ids = limitFans.map((f) => f.id);
        expect(ids).toContain('thirteen-orphans');
        expect(ids).toContain('big-four-winds');
        expect(ids).toContain('all-kongs');
    });

    it('所有例牌都應該係高番數', () => {
        const limitFans = getLimitFans();
        for (const fan of limitFans) {
            expect(fan.value).toBeGreaterThanOrEqual(8);
        }
    });
});

// ============================================
// getFanById Tests (O(1) lookup)
// ============================================

describe('getFanById (O(1) lookup)', () => {
    it('應該可以快速取得番種', () => {
        const fan = getFanById('all-chows');
        expect(fan).toBeDefined();
        expect(fan?.name).toBe('平胡');
    });

    it('唔存在嘅 ID 應該返回 undefined', () => {
        const fan = getFanById('non-existent');
        expect(fan).toBeUndefined();
    });

    it('所有番種都應該可以用 ID 取得', () => {
        for (const fan of CANTONESE_FAN_TYPES) {
            const found = getFanById(fan.id);
            expect(found).toBe(fan);
        }
    });
});

// ============================================
// Normal Mode Tests (揀牌型計番)
// ============================================

describe('Normal Mode 計分', () => {
    it('3番自摸 - 莊家贏', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['all-pungs'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.isDealerWin).toBe(true);
    });

    it('混一色 + 對對糊 = 6番', () => {
        const players = createTestPlayers();
        const result = calculateScoreNormalMode(
            'self-draw',
            players[1].id,
            undefined,
            ['half-flush', 'all-pungs'],
            players,
            players[0].id
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(6);
    });

    it('清一色 唔重複計混一色', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['full-flush', 'half-flush'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(7);
    });

    it('大三元包含小三元', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['big-dragons', 'small-dragons'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(8); // 只計大三元
    });

    it('大四喜包含小四喜同對對糊', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['big-four-winds', 'small-four-winds', 'all-pungs'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(13); // 只計大四喜
    });

    it('番數不足應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['all-chows'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toContain('番數不足');
        expect(result.totalFan).toBe(1);
    });

    it('封頂 13 番', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['thirteen-orphans', 'self-draw'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(14);
        expect(result.basePoints).toBe(Math.pow(2, 13));
    });

    it('空番種列表應該返回 0 番', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: [],
            players,
            dealerId: players[0].id,
        });

        expect(result.totalFan).toBe(0);
        expect(result.error).toContain('番數不足');
    });
});

// ============================================
// Pro Mode Tests (直接輸入番數)
// ============================================

describe('Pro Mode 計分', () => {
    it('直接輸入 3 番 - 自摸莊家贏', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            3,
            players,
            players[0].id,
            '對對糊'
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.basePoints).toBe(8);
        expect(result.fanDescription).toBe('對對糊');
    });

    it('直接輸入 5 番 - 出銃（全銃制）', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[1].id,
            players[0].id,
            5,
            players,
            players[0].id,
            '小三元'
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(5);
        expect(result.basePoints).toBe(32);

        // 全銃制：莊家出銃要包晒 = 莊家畀雙倍 + 其他兩家畀單倍 = 64 + 32 + 32 = 128
        const loserChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(loserChange?.delta).toBe(-128);
    });

    it('Pro Mode 番數不足應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            2,
            players,
            players[0].id
        );

        expect(result.error).toContain('番數不足');
    });

    it('Pro Mode 0番（雞糊）應該報錯（3番起胡）', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            0,
            players,
            players[0].id
        );

        expect(result.error).toContain('番數不足');
    });

    it('Pro Mode 負數番數應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            -1,
            players,
            players[0].id
        );

        expect(result.error).toContain('番數不足');
    });
});

// ============================================
// 清章 vs 新章 Tests
// ============================================

describe('清章 vs 新章', () => {
    it('清章模式唔計七對子', () => {
        const standardConfig: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            variant: 'standard',
        };

        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['seven-pairs'],
            players,
            dealerId: players[0].id,
        }, standardConfig);

        expect(result.totalFan).toBe(0);
    });

    it('新章模式計七對子', () => {
        const customConfig: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            variant: 'custom',
        };

        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['seven-pairs'],
            players,
            dealerId: players[0].id,
        }, customConfig);

        expect(result.totalFan).toBe(3);
    });

    it('新章模式計一條龍', () => {
        const customConfig: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            variant: 'custom',
            minFan: 2,
        };

        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['straight'],
            players,
            dealerId: players[0].id,
        }, customConfig);

        expect(result.totalFan).toBe(2);
        expect(result.error).toBeUndefined();
    });
});

// ============================================
// Payment Calculation Tests
// ============================================

describe('分數計算', () => {
    it('自摸莊家贏 - 其他三家各畀雙倍', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            3,
            players,
            players[0].id
        );

        // 3番 = 8 base, 莊家贏其他人畀雙倍 = 16
        const winnerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(winnerChange?.delta).toBe(48); // 16 + 16 + 16

        for (let i = 1; i <= 3; i++) {
            const loserChange = result.changes.find((c) => c.playerId === players[i].id);
            expect(loserChange?.delta).toBe(-16);
        }
    });

    it('自摸閒家贏 - 莊家畀雙倍，其他閒家畀單倍', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[1].id,
            undefined,
            3,
            players,
            players[0].id
        );

        // 3番 = 8 base
        // 莊家畀雙倍 = 16
        // 其他兩個閒家各畀 8
        const dealerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(dealerChange?.delta).toBe(-16);

        const winnerChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(winnerChange?.delta).toBe(32); // 16 + 8 + 8
    });

    it('出銃（全銃制）- 出銃者包晒', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[1].id,
            players[2].id,
            3,
            players,
            players[0].id
        );

        // 全銃制：閒家贏閒家出銃
        // 贏家收：莊家畀雙倍(16) + 出銃者單倍(8) + 另一閒家單倍(8) = 32
        // 出銃者包晒
        const winnerChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(winnerChange?.delta).toBe(32);

        const loserChange = result.changes.find((c) => c.playerId === players[2].id);
        expect(loserChange?.delta).toBe(-32);

        // 其他人無影響（全銃制）
        const otherChange1 = result.changes.find((c) => c.playerId === players[0].id);
        const otherChange2 = result.changes.find((c) => c.playerId === players[3].id);
        expect(otherChange1?.delta).toBe(0);
        expect(otherChange2?.delta).toBe(0);
    });

    it('出銃莊家贏（全銃制）- 出銃者包晒', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[0].id,
            players[1].id,
            3,
            players,
            players[0].id
        );

        // 全銃制：莊家贏閒家出銃
        // 贏家收：莊家贏三家都畀雙倍 = 16 + 16 + 16 = 48
        const winnerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(winnerChange?.delta).toBe(48);

        const loserChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(loserChange?.delta).toBe(-48);
    });
});

// ============================================
// Error Handling Tests
// ============================================

describe('錯誤處理', () => {
    it('搵唔到贏家應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            'non-existent-id',
            undefined,
            5,
            players,
            players[0].id
        );

        expect(result.error).toContain('搵唔到贏家');
    });

    it('出銃冇指定出銃者應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[0].id,
            undefined,
            5,
            players,
            players[0].id
        );

        expect(result.error).toContain('出銃需要指定出銃者');
    });

    it('出銃者唔存在應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[0].id,
            'non-existent-id',
            5,
            players,
            players[0].id
        );

        expect(result.error).toContain('搵唔到出銃者');
    });
});

// ============================================
// Validation Tests
// ============================================

describe('番種驗證', () => {
    it('互斥番種應該報衝突', () => {
        const result = validateFanCombination(['all-chows', 'all-pungs']);
        expect(result.valid).toBe(false);
        expect(result.conflicts.length).toBe(1);
    });

    it('冇衝突嘅組合應該 valid', () => {
        const result = validateFanCombination(['full-flush', 'all-pungs', 'self-draw']);
        expect(result.valid).toBe(true);
    });

    it('清一色同混一色互斥', () => {
        const result = validateFanCombination(['full-flush', 'half-flush']);
        expect(result.valid).toBe(false);
    });

    it('大三元同小三元互斥', () => {
        const result = validateFanCombination(['big-dragons', 'small-dragons']);
        expect(result.valid).toBe(false);
    });

    it('空列表應該 valid', () => {
        const result = validateFanCombination([]);
        expect(result.valid).toBe(true);
    });
});

// ============================================
// Helper Function Tests
// ============================================

describe('輔助函數', () => {
    it('應該可以按分類取得番種', () => {
        const situational = getFansByCategory('situational');
        expect(situational.length).toBeGreaterThan(0);
        expect(situational.every((f) => f.category === 'situational')).toBe(true);
    });

    it('應該可以取得常用番種', () => {
        const common = getCommonFans();
        expect(common.length).toBeGreaterThan(0);
        const ids = common.map((f) => f.id);
        expect(ids).toContain('all-chows');
        expect(ids).toContain('full-flush');
    });

    it('getFansByCategory 應該 respect variant', () => {
        const standardSpecial = getFansByCategory('special', 'standard');
        const customSpecial = getFansByCategory('special', 'custom');

        // Custom 應該多過 standard（因為有額外嘅自訂牌型）
        expect(customSpecial.length).toBeGreaterThan(standardSpecial.length);
    });
});

// ============================================
// RuleSet Tests
// ============================================

describe('牌制設定', () => {
    it('廣東牌應該有正確嘅設定', () => {
        expect(CANTONESE_RULESET.id).toBe('cantonese');
        expect(CANTONESE_RULESET.name).toBe('廣東牌');
        expect(CANTONESE_RULESET.minFan).toBe(3);
        expect(CANTONESE_RULESET.maxFan).toBe(13);
    });
});

// ============================================
// 效能測試
// ============================================

describe('效能測試', () => {
    it('計分應該喺 1ms 內完成', () => {
        const players = createTestPlayers();
        const start = performance.now();

        for (let i = 0; i < 100; i++) {
            calculateScoreProMode(
                'self-draw',
                players[0].id,
                undefined,
                5,
                players,
                players[0].id
            );
        }

        const end = performance.now();
        const avgTime = (end - start) / 100;

        expect(avgTime).toBeLessThan(1);
    });

    it('Normal Mode 計分應該喺 1ms 內完成', () => {
        const players = createTestPlayers();
        const start = performance.now();

        for (let i = 0; i < 100; i++) {
            calculateScoreNormalMode(
                'self-draw',
                players[0].id,
                undefined,
                ['full-flush', 'all-pungs', 'self-draw'],
                players,
                players[0].id
            );
        }

        const end = performance.now();
        const avgTime = (end - start) / 100;

        expect(avgTime).toBeLessThan(1);
    });

    it('getFanById 應該做到 O(1) lookup', () => {
        const start = performance.now();

        for (let i = 0; i < 10000; i++) {
            getFanById('thirteen-orphans');
        }

        const end = performance.now();
        const totalTime = end - start;

        // 10000 次查詢應該喺 10ms 內完成
        expect(totalTime).toBeLessThan(10);
    });

    it('validateFanCombination 應該快速執行', () => {
        const start = performance.now();

        for (let i = 0; i < 1000; i++) {
            validateFanCombination(['full-flush', 'all-pungs', 'self-draw', 'concealed']);
        }

        const end = performance.now();
        const totalTime = end - start;

        // 1000 次驗證應該喺 50ms 內完成
        expect(totalTime).toBeLessThan(50);
    });
});

// ============================================
// Config 自訂測試
// ============================================

describe('自訂 Config', () => {
    it('可以自訂 minFan', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            minFan: 0,
        };

        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: [], // 0 番
            players,
            dealerId: players[0].id,
        }, config);

        // minFan = 0，所以 0 番都可以
        expect(result.error).toBeUndefined();
    });

    it('可以自訂 maxFan', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            maxFan: 8,
        };

        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            13,
            players,
            players[0].id,
            undefined,
            config
        );

        // maxFan = 8，所以分數封頂喺 2^8 = 256
        expect(result.basePoints).toBe(256);
    });

    it('可以自訂 baseScore', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            baseScore: 2,
        };

        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            3,
            players,
            players[0].id,
            undefined,
            config
        );

        // baseScore = 2, 3番 = 2 * 2^3 = 16
        expect(result.basePoints).toBe(16);
    });
});

// ============================================
// 半銃制 vs 全銃制 Tests
// ============================================

describe('半銃制 vs 全銃制', () => {
    it('半銃制：出銃者畀雙倍，其他兩家畀單倍', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            paymentMode: 'half',
        };

        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[1].id,
            players[2].id,
            3,
            players,
            players[0].id,
            undefined,
            config
        );

        // 半銃制：
        // 莊家畀雙倍 = 16
        // 出銃者畀雙倍（單倍x2）= 16
        // 其他閒家畀單倍 = 8
        // 總共 = 40
        const winnerChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(winnerChange?.delta).toBe(40);

        const loserChange = result.changes.find((c) => c.playerId === players[2].id);
        expect(loserChange?.delta).toBe(-16);

        const dealerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(dealerChange?.delta).toBe(-16);

        const otherChange = result.changes.find((c) => c.playerId === players[3].id);
        expect(otherChange?.delta).toBe(-8);
    });

    it('全銃制：出銃者包晒', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            paymentMode: 'full',
        };

        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[1].id,
            players[2].id,
            3,
            players,
            players[0].id,
            undefined,
            config
        );

        // 全銃制：
        // 贏家收：莊家雙倍(16) + 出銃者單倍(8) + 另一閒家(8) = 32
        // 出銃者包晒
        const winnerChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(winnerChange?.delta).toBe(32);

        const loserChange = result.changes.find((c) => c.playerId === players[2].id);
        expect(loserChange?.delta).toBe(-32);

        // 其他人無影響
        expect(result.changes.find((c) => c.playerId === players[0].id)?.delta).toBe(0);
        expect(result.changes.find((c) => c.playerId === players[3].id)?.delta).toBe(0);
    });
});

// ============================================
// 辣辣上 vs 半辣上 Tests
// ============================================

describe('辣辣上 vs 半辣上', () => {
    it('辣辣上：每番加倍', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            escalationMode: 'double',
            minFan: 0,
        };

        const players = createTestPlayers();

        // 測試各個番數
        const testCases = [
            { fan: 0, expected: 1 },
            { fan: 1, expected: 2 },
            { fan: 2, expected: 4 },
            { fan: 3, expected: 8 },
            { fan: 4, expected: 16 },
            { fan: 5, expected: 32 },
            { fan: 6, expected: 64 },
        ];

        for (const tc of testCases) {
            const result = calculateScoreProMode(
                'self-draw',
                players[0].id,
                undefined,
                tc.fan,
                players,
                players[1].id,
                undefined,
                config
            );
            expect(result.basePoints).toBe(tc.expected);
        }
    });

    it('半辣上：四番後交替 x1.5 同 x2', () => {
        const config: ScoringConfig = {
            ...DEFAULT_SCORING_CONFIG,
            escalationMode: 'halfDouble',
            minFan: 0,
        };

        const players = createTestPlayers();

        // 測試各個番數
        const testCases = [
            { fan: 0, expected: 1 },
            { fan: 1, expected: 2 },
            { fan: 2, expected: 4 },
            { fan: 3, expected: 8 },
            { fan: 4, expected: 16 },
            { fan: 5, expected: 24 },   // 4番 x 1.5
            { fan: 6, expected: 32 },   // 4番 x 2
            { fan: 7, expected: 48 },   // 6番 x 1.5
            { fan: 8, expected: 64 },   // 6番 x 2
            { fan: 9, expected: 96 },   // 8番 x 1.5
            { fan: 10, expected: 128 }, // 8番 x 2
        ];

        for (const tc of testCases) {
            const result = calculateScoreProMode(
                'self-draw',
                players[0].id,
                undefined,
                tc.fan,
                players,
                players[1].id,
                undefined,
                config
            );
            expect(result.basePoints).toBe(tc.expected);
        }
    });
});
