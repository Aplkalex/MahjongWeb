/**
 * 🀄 廣東牌計分引擎測試
 *
 * 測試各種計分情景，確保邏輯正確
 * 包括：
 * - Pro Mode / Normal Mode
 * - 清章 / 新章
 * - 完整番種計算
 */

import { describe, it, expect } from 'vitest';
import {
    calculateCantoneseScore,
    calculateScoreProMode,
    calculateScoreNormalMode,
    CANTONESE_FAN_TYPES,
    CANTONESE_RULESET,
    DEFAULT_SCORING_CONFIG,
    validateFanCombination,
    getFansByCategory,
    getCommonFans,
    getStandardFans,
    getCustomFans,
    getLimitFans,
    ScoringConfig,
} from '../cantonese';
import { createPlayers, Player } from '../types';

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

    it('互斥番種應該雙向定義', () => {
        const allChows = CANTONESE_FAN_TYPES.find((f) => f.id === 'all-chows');
        const allPungs = CANTONESE_FAN_TYPES.find((f) => f.id === 'all-pungs');

        expect(allChows?.incompatibleWith).toContain('all-pungs');
        expect(allPungs?.incompatibleWith).toContain('all-chows');
    });

    it('應該有正確嘅清章番種', () => {
        const standardFans = getStandardFans();
        expect(standardFans.length).toBeGreaterThan(20);

        // 檢查一啲標準番存在
        const ids = standardFans.map((f) => f.id);
        expect(ids).toContain('all-chows');
        expect(ids).toContain('all-pungs');
        expect(ids).toContain('full-flush');
        expect(ids).toContain('thirteen-orphans');
    });

    it('應該有正確嘅新章番種', () => {
        const customFans = getCustomFans();
        expect(customFans.length).toBeGreaterThan(5);

        // 檢查一啲自訂番存在
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
});

// ============================================
// Normal Mode Tests (揀牌型計番)
// ============================================

describe('Normal Mode 計分', () => {
    it('3台自摸 - 莊家贏', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['all-pungs'], // 3番
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.isDealerWin).toBe(true);
    });

    it('混一色 + 對對糊 = 6台', () => {
        const players = createTestPlayers();
        const result = calculateScoreNormalMode(
            'self-draw',
            players[1].id,
            undefined,
            ['half-flush', 'all-pungs'], // 3 + 3 = 6
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
            selectedFanIds: ['full-flush', 'half-flush'], // 清一色包含混一色
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(7); // 只計清一色 7 台
    });

    it('番數不足應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['all-chows'], // 只有 1 番
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
            selectedFanIds: ['thirteen-orphans', 'self-draw'], // 13 + 1 = 14
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(14);
        // 封頂 13 番 = 1 * 2^13 = 8192
        expect(result.basePoints).toBe(Math.pow(2, 13));
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
        // 3番 = 1 * 2^3 = 8
        expect(result.basePoints).toBe(8);
        expect(result.fanDescription).toBe('對對糊');
    });

    it('直接輸入 5 番 - 出銃', () => {
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
        // 5番 = 1 * 2^5 = 32
        expect(result.basePoints).toBe(32);

        // 莊家出銃要畀雙倍 = 64
        const loserChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(loserChange?.delta).toBe(-64);
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
            selectedFanIds: ['seven-pairs'], // 新章先有
            players,
            dealerId: players[0].id,
        }, standardConfig);

        // 七對子喺清章唔計，所以番數係 0
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
