/**
 * 🀄 廣東牌計分規則
 * 
 * 廣東牌（港式）計分規則：
 * - 底：$4（可調）
 * - 每番加倍
 * - 封頂：13番（可調）
 * - 最少：3番（可調）
 * - 自摸：三家畀
 * - 出銃：出銃者一人畀
 * - 莊家：贏/輸都加倍
 */

import {
    FanType,
    FanCategory,
    RuleSet,
    ScoreCalculationParams,
    ScoreResult,
    ScoreChange,
    Player,
    WinType,
} from './types';

// ============================================
// 番種定義
// ============================================

/**
 * 廣東牌所有番種
 * 按照分類同番數排列
 */
export const CANTONESE_FAN_TYPES: FanType[] = [
    // ============ 基本 (Basic) ============
    {
        id: 'chicken',
        name: '雞糊',
        nameEn: 'Chicken Hand',
        value: 0,
        category: 'basic',
        description: '冇番，但滿足最低要求時可以食',
    },
    {
        id: 'all-chows',
        name: '平糊',
        nameEn: 'All Chows',
        value: 1,
        category: 'basic',
        description: '全部係順子，冇刻子',
        incompatibleWith: ['all-pungs'],
    },

    // ============ 刻子相關 (Triplets) ============
    {
        id: 'all-pungs',
        name: '對對糊',
        nameEn: 'All Pungs',
        value: 3,
        category: 'triplets',
        description: '全部係刻子（碰碰糊）',
        incompatibleWith: ['all-chows'],
    },

    // ============ 花色相關 (Suits) ============
    {
        id: 'half-flush',
        name: '混一色',
        nameEn: 'Half Flush',
        value: 3,
        category: 'suits',
        description: '一種花色加字牌',
        incompatibleWith: ['full-flush', 'all-honors'],
    },
    {
        id: 'full-flush',
        name: '清一色',
        nameEn: 'Full Flush',
        value: 7,
        category: 'suits',
        description: '全部同一種花色，冇字牌',
        incompatibleWith: ['half-flush', 'all-honors'],
        includes: ['half-flush'],
    },
    {
        id: 'all-honors',
        name: '字一色',
        nameEn: 'All Honors',
        value: 10,
        category: 'suits',
        description: '全部係字牌（風牌同三元牌）',
        incompatibleWith: ['half-flush', 'full-flush'],
    },

    // ============ 字牌相關 (Honors) ============
    {
        id: 'small-dragons',
        name: '小三元',
        nameEn: 'Small Three Dragons',
        value: 5,
        category: 'honors',
        description: '兩組三元刻子，一組三元對子',
        incompatibleWith: ['big-dragons'],
    },
    {
        id: 'big-dragons',
        name: '大三元',
        nameEn: 'Big Three Dragons',
        value: 8,
        category: 'honors',
        description: '三組三元刻子（中發白）',
        incompatibleWith: ['small-dragons'],
        includes: ['small-dragons'],
    },
    {
        id: 'small-winds',
        name: '小四喜',
        nameEn: 'Small Four Winds',
        value: 6,
        category: 'honors',
        description: '三組風刻子，一組風對子',
        incompatibleWith: ['big-winds'],
    },
    {
        id: 'big-winds',
        name: '大四喜',
        nameEn: 'Big Four Winds',
        value: 13,
        category: 'honors',
        description: '四組風刻子（東南西北）',
        incompatibleWith: ['small-winds'],
        includes: ['small-winds'],
    },

    // ============ 特殊 (Special) ============
    {
        id: 'seven-pairs',
        name: '七對',
        nameEn: 'Seven Pairs',
        value: 4,
        category: 'special',
        description: '七個對子',
    },
    {
        id: 'thirteen-orphans',
        name: '十三么',
        nameEn: 'Thirteen Orphans',
        value: 13,
        category: 'special',
        description: '所有么九牌加字牌各一隻',
    },
    {
        id: 'nine-gates',
        name: '九蓮寶燈',
        nameEn: 'Nine Gates',
        value: 13,
        category: 'special',
        description: '1112345678999 同一花色',
        includes: ['full-flush'],
    },
    {
        id: 'all-kongs',
        name: '十八羅漢',
        nameEn: 'All Kongs',
        value: 13,
        category: 'special',
        description: '四組槓子',
    },

    // ============ 情景 (Situational) ============
    {
        id: 'self-draw',
        name: '自摸',
        nameEn: 'Self Draw',
        value: 1,
        category: 'situational',
        description: '自己摸牌食糊',
    },
    {
        id: 'concealed',
        name: '門清',
        nameEn: 'Concealed Hand',
        value: 1,
        category: 'situational',
        description: '冇碰冇槓，全部暗牌',
    },
    {
        id: 'last-tile-draw',
        name: '海底撈月',
        nameEn: 'Win on Last Tile (Self Draw)',
        value: 1,
        category: 'situational',
        description: '摸最後一隻牌食糊',
    },
    {
        id: 'last-tile-discard',
        name: '河底撈魚',
        nameEn: 'Win on Last Tile (Discard)',
        value: 1,
        category: 'situational',
        description: '最後一隻打出嘅牌食糊',
    },
    {
        id: 'win-on-kong',
        name: '槓上開花',
        nameEn: 'Win on Kong',
        value: 1,
        category: 'situational',
        description: '槓後摸嘅牌食糊',
    },
    {
        id: 'robbing-kong',
        name: '搶槓',
        nameEn: 'Robbing the Kong',
        value: 1,
        category: 'situational',
        description: '人哋加槓時搶糊',
    },
];

// ============================================
// 計分邏輯
// ============================================

/**
 * 計算番數對應嘅基本分數
 * 
 * 公式：底 × 2^(番數-1)
 * 例如：
 * - 3番 = 4 × 2^2 = 16
 * - 5番 = 4 × 2^4 = 64
 * - 10番 = 4 × 2^9 = 2048（但會封頂）
 */
function calculateBasePoints(
    fan: number,
    baseScore: number,
    maxFan: number
): number {
    if (fan <= 0) return 0;

    // 套用封頂
    const effectiveFan = Math.min(fan, maxFan);

    // 計算：底 × 2^(番數-1)
    return baseScore * Math.pow(2, effectiveFan - 1);
}

/**
 * 計算選擇咗嘅番種總番數
 * 處理互斥同疊加規則
 */
function calculateTotalFan(
    selectedFanIds: string[],
    fanTypes: FanType[]
): { totalFan: number; validFans: FanType[] } {
    const validFans: FanType[] = [];
    const includedIds = new Set<string>();

    // 先收集所有「已包含」嘅番
    for (const fanId of selectedFanIds) {
        const fan = fanTypes.find((f) => f.id === fanId);
        if (fan?.includes) {
            fan.includes.forEach((id) => includedIds.add(id));
        }
    }

    // 計算有效番數
    let totalFan = 0;
    for (const fanId of selectedFanIds) {
        const fan = fanTypes.find((f) => f.id === fanId);
        if (!fan) continue;

        // 如果呢個番已經被其他番包含，唔計
        if (includedIds.has(fan.id)) continue;

        validFans.push(fan);
        totalFan += fan.value;
    }

    return { totalFan, validFans };
}

/**
 * 廣東牌計分主函數
 * 支援兩種模式：
 * - Pro Mode: 直接輸入番數
 * - Normal Mode: 揀牌型計番
 */
export function calculateCantoneseScore(
    params: ScoreCalculationParams
): ScoreResult {
    const { winType, winnerId, loserId, players, dealerId } = params;

    // 基本設定
    const baseScore = CANTONESE_RULESET.baseScore;
    const maxFan = CANTONESE_RULESET.maxFan;
    const minFan = CANTONESE_RULESET.minFan;

    // 搵贏家
    const winner = players.find((p) => p.id === winnerId);
    if (!winner) {
        return {
            totalFan: 0,
            basePoints: 0,
            fanDescription: '',
            changes: [],
            isDealerWin: false,
            error: '搵唔到贏家',
        };
    }

    // 根據模式計算番數
    let totalFan: number;
    let fanDescription: string;

    if (params.mode === 'pro') {
        // Pro Mode: 直接用輸入嘅番數
        totalFan = params.fanCount;
        fanDescription = params.description || `${params.fanCount} 番`;
    } else {
        // Normal Mode: 計算選擇嘅番種
        const { totalFan: calculatedFan, validFans } = calculateTotalFan(
            params.selectedFanIds,
            CANTONESE_FAN_TYPES
        );
        totalFan = calculatedFan;
        fanDescription = validFans.map((f) => f.name).join('、') || '雞糊';
    }

    // 檢查最低番數
    if (totalFan < minFan) {
        return {
            totalFan,
            basePoints: 0,
            fanDescription,
            changes: [],
            isDealerWin: winner.id === dealerId,
            error: `番數不足，最少要 ${minFan} 番`,
        };
    }

    // 計算基本分數
    const basePoints = calculateBasePoints(totalFan, baseScore, maxFan);

    // 檢查係咪莊家
    const isDealerWin = winner.id === dealerId;
    const isDealerLose = loserId === dealerId;

    // 計算每個玩家嘅分數變化
    const changes: ScoreChange[] = [];

    if (winType === 'self-draw') {
        // 自摸：其他三家各自畀錢
        // 莊家贏：其他人畀雙倍
        // 莊家輸：畀雙倍
        let totalWinAmount = 0;

        for (const player of players) {
            if (player.id === winnerId) continue;

            // 計算呢個玩家要畀幾多
            let payment = basePoints;

            // 如果贏家係莊，或者呢個輸家係莊，加倍
            if (isDealerWin || player.id === dealerId) {
                payment *= 2;
            }

            totalWinAmount += payment;

            changes.push({
                playerId: player.id,
                delta: -payment,
                newScore: player.score - payment,
            });
        }

        // 贏家收錢
        changes.push({
            playerId: winnerId,
            delta: totalWinAmount,
            newScore: winner.score + totalWinAmount,
        });

    } else {
        // 出銃：出銃者一人畀全部
        if (!loserId) {
            return {
                totalFan,
                basePoints,
                fanDescription,
                changes: [],
                isDealerWin,
                error: '出銃需要指定出銃者',
            };
        }

        const loser = players.find((p) => p.id === loserId);
        if (!loser) {
            return {
                totalFan,
                basePoints,
                fanDescription,
                changes: [],
                isDealerWin,
                error: '搵唔到出銃者',
            };
        }

        // 計算要畀幾多
        let payment = basePoints;

        // 如果贏家係莊，或者出銃者係莊，加倍
        if (isDealerWin || isDealerLose) {
            payment *= 2;
        }

        // 記錄變化
        for (const player of players) {
            if (player.id === winnerId) {
                changes.push({
                    playerId: player.id,
                    delta: payment,
                    newScore: player.score + payment,
                });
            } else if (player.id === loserId) {
                changes.push({
                    playerId: player.id,
                    delta: -payment,
                    newScore: player.score - payment,
                });
            } else {
                changes.push({
                    playerId: player.id,
                    delta: 0,
                    newScore: player.score,
                });
            }
        }
    }

    return {
        totalFan,
        basePoints,
        fanDescription,
        changes,
        isDealerWin,
    };
}

/**
 * Pro Mode 專用計分函數（簡化版）
 * 直接輸入番數計分
 */
export function calculateScoreProMode(
    winType: WinType,
    winnerId: string,
    loserId: string | undefined,
    fanCount: number,
    players: Player[],
    dealerId: string,
    description?: string
): ScoreResult {
    return calculateCantoneseScore({
        mode: 'pro',
        winType,
        winnerId,
        loserId,
        fanCount,
        description,
        players,
        dealerId,
    });
}

/**
 * Normal Mode 專用計分函數（簡化版）
 * 揀牌型計番
 */
export function calculateScoreNormalMode(
    winType: WinType,
    winnerId: string,
    loserId: string | undefined,
    selectedFanIds: string[],
    players: Player[],
    dealerId: string
): ScoreResult {
    return calculateCantoneseScore({
        mode: 'normal',
        winType,
        winnerId,
        loserId,
        selectedFanIds,
        players,
        dealerId,
    });
}

// ============================================
// RuleSet 定義
// ============================================

/**
 * 廣東牌規則集
 */
export const CANTONESE_RULESET: RuleSet = {
    id: 'cantonese',
    name: '廣東牌',
    fanTypes: CANTONESE_FAN_TYPES,
    baseScore: 4,      // 每底 $4
    minFan: 3,         // 最少 3 番
    maxFan: 13,        // 封頂 13 番
    startingScore: 500, // 起始 $500
    calculateScore: calculateCantoneseScore,
};

// ============================================
// 輔助函數
// ============================================

/**
 * 按分類取得番種
 */
export function getFansByCategory(
    category: FanCategory
): FanType[] {
    return CANTONESE_FAN_TYPES.filter((f) => f.category === category);
}

/**
 * 取得常用番種（用於快速選擇）
 */
export function getCommonFans(): FanType[] {
    const commonIds = [
        'all-chows',
        'all-pungs',
        'half-flush',
        'full-flush',
        'self-draw',
        'concealed',
    ];
    return CANTONESE_FAN_TYPES.filter((f) => commonIds.includes(f.id));
}

/**
 * 檢查番種組合係咪有效（冇互斥）
 */
export function validateFanCombination(
    fanIds: string[]
): { valid: boolean; conflicts: string[][] } {
    const conflicts: string[][] = [];

    for (let i = 0; i < fanIds.length; i++) {
        const fan = CANTONESE_FAN_TYPES.find((f) => f.id === fanIds[i]);
        if (!fan?.incompatibleWith) continue;

        for (let j = i + 1; j < fanIds.length; j++) {
            if (fan.incompatibleWith.includes(fanIds[j])) {
                const conflictFan = CANTONESE_FAN_TYPES.find((f) => f.id === fanIds[j]);
                conflicts.push([fan.name, conflictFan?.name || fanIds[j]]);
            }
        }
    }

    return {
        valid: conflicts.length === 0,
        conflicts,
    };
}
