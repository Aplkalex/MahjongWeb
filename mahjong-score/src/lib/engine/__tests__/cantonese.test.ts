/**
 * 🀄 廣東牌計分引擎測試
 *
 * 測試各種計分情景，確保邏輯正確
 * 包括 Pro Mode（直接輸入番數）同 Normal Mode（揀牌型）
 */

import { describe, it, expect } from 'vitest';
import {
    calculateCantoneseScore,
    calculateScoreProMode,
    calculateScoreNormalMode,
    CANTONESE_FAN_TYPES,
    CANTONESE_RULESET,
    validateFanCombination,
    getFansByCategory,
    getCommonFans,
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
    it('應該有正確數量嘅番種', () => {
        expect(CANTONESE_FAN_TYPES.length).toBeGreaterThan(15);
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
            selectedFanIds: ['all-chows', 'self-draw', 'concealed'], // 1+1+1 = 3番
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.basePoints).toBe(16); // 4 * 2^2 = 16
        expect(result.isDealerWin).toBe(true);

        // 莊家贏自摸：其他三家各畀雙倍 = 16 * 2 = 32
        const winnerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(winnerChange?.delta).toBe(32 * 3); // 96
    });

    it('3番自摸 - 閒家贏', () => {
        const players = createTestPlayers();
        const result = calculateScoreNormalMode(
            'self-draw',
            players[1].id,
            undefined,
            ['all-chows', 'self-draw', 'concealed'],
            players,
            players[0].id
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.isDealerWin).toBe(false);

        // 閒家贏自摸：莊家畀雙倍 = 32，其他兩個閒家各畀 16
        const dealerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(dealerChange?.delta).toBe(-32);

        const winner = result.changes.find((c) => c.playerId === players[1].id);
        expect(winner?.delta).toBe(32 + 16 + 16); // 64
    });

    it('5番出銃 - 莊家出銃畀閒家', () => {
        const players = createTestPlayers();
        const result = calculateScoreNormalMode(
            'discard',
            players[1].id,
            players[0].id,
            ['all-pungs', 'self-draw', 'concealed'], // 3+1+1 = 5番
            players,
            players[0].id
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(5);
        expect(result.basePoints).toBe(64); // 4 * 2^4 = 64

        // 莊家出銃要畀雙倍 = 128
        const loserChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(loserChange?.delta).toBe(-128);

        const winnerChange = result.changes.find((c) => c.playerId === players[1].id);
        expect(winnerChange?.delta).toBe(128);
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
        expect(result.changes).toHaveLength(0);
    });

    it('大番已包含細番（清一色包含混一色）', () => {
        const players = createTestPlayers();
        const result = calculateCantoneseScore({
            mode: 'normal',
            winType: 'self-draw',
            winnerId: players[0].id,
            selectedFanIds: ['full-flush', 'half-flush', 'self-draw'],
            players,
            dealerId: players[0].id,
        });

        expect(result.error).toBeUndefined();
        // 應該只計 7 + 1 = 8，唔計混一色
        expect(result.totalFan).toBe(8);
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
            3, // 直接輸入 3 番
            players,
            players[0].id,
            '平糊自摸門清'
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(3);
        expect(result.basePoints).toBe(16);
        expect(result.fanDescription).toBe('平糊自摸門清');
        expect(result.isDealerWin).toBe(true);

        // 莊家贏自摸：其他三家各畀雙倍
        const winnerChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(winnerChange?.delta).toBe(96); // 32 * 3
    });

    it('直接輸入 5 番 - 出銃', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'discard',
            players[1].id,
            players[0].id, // 莊家出銃
            5,
            players,
            players[0].id,
            '清一色'
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(5);
        expect(result.basePoints).toBe(64);
        expect(result.fanDescription).toBe('清一色');

        // 莊家出銃要畀雙倍 = 128
        const loserChange = result.changes.find((c) => c.playerId === players[0].id);
        expect(loserChange?.delta).toBe(-128);
    });

    it('直接輸入番數 - 冇描述時顯示番數', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            5,
            players,
            players[0].id
            // 冇傳 description
        );

        expect(result.fanDescription).toBe('5 番');
    });

    it('Pro Mode 番數不足應該報錯', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            2, // 只有 2 番
            players,
            players[0].id
        );

        expect(result.error).toContain('番數不足');
        expect(result.totalFan).toBe(2);
        expect(result.changes).toHaveLength(0);
    });

    it('封頂 13 番', () => {
        const players = createTestPlayers();
        const result = calculateScoreProMode(
            'self-draw',
            players[0].id,
            undefined,
            15, // 超過封頂
            players,
            players[0].id,
            '十三么加自摸'
        );

        expect(result.error).toBeUndefined();
        expect(result.totalFan).toBe(15);
        // 封頂 13 番 = 4 * 2^12 = 16384
        expect(result.basePoints).toBe(4 * Math.pow(2, 12));
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
        expect(result.conflicts.length).toBe(0);
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
        expect(CANTONESE_RULESET.baseScore).toBe(4);
        expect(CANTONESE_RULESET.minFan).toBe(3);
        expect(CANTONESE_RULESET.maxFan).toBe(13);
        expect(CANTONESE_RULESET.startingScore).toBe(500);
    });
});
