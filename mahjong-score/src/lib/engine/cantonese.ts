/**
 * 🀄 廣東牌（香港牌）計分規則
 * 
 * 根據 Wikipedia 香港麻將條目整理
 * 
 * 計分規則：
 * - 底：$1（可調）
 * - 每番加倍
 * - 封頂：8/10/13台（可調）
 * - 最少：0/1/3台起胡（可調）
 * - 自摸：三家畀
 * - 出銃：全銃 / 陪銃
 * - 莊家：贏/輸都加倍
 * 
 * 支援：
 * - 清章（正統牌型）
 * - 新章（加入自訂牌型）
 */

import {
    FanType,
    FanCategory,
    RuleSet,
    RuleVariant,
    ScoreCalculationParams,
    ScoreResult,
    ScoreChange,
    Player,
    WinType,
} from './types';

// ============================================
// 番種定義（按番數排列）
// ============================================

/**
 * 香港麻將完整番種表
 * 根據 Wikipedia 整理
 */
export const CANTONESE_FAN_TYPES: FanType[] = [
    // ============================================
    // 零番 (0 Fan)
    // ============================================
    {
        id: 'chicken',
        name: '屁胡',
        nameEn: 'Chicken Hand',
        value: 0,
        category: 'basic',
        description: '單純四搭一對，無任何其他組合',
    },

    // ============================================
    // 一番 (1 Fan)
    // ============================================
    {
        id: 'all-chows',
        name: '平胡',
        nameEn: 'All Chows',
        value: 1,
        category: 'basic',
        description: '只有順子、沒有刻子的牌型',
        incompatibleWith: ['all-pungs'],
    },
    {
        id: 'no-flowers',
        name: '無花',
        nameEn: 'No Flowers',
        value: 1,
        category: 'flowers',
        description: '沒有花牌',
    },
    {
        id: 'seat-flower',
        name: '正花',
        nameEn: 'Seat Flower',
        value: 1,
        category: 'flowers',
        description: '花牌跟座位吻合（東=春/梅、南=夏/蘭、西=秋/菊、北=冬/竹）',
    },
    {
        id: 'self-draw',
        name: '自摸',
        nameEn: 'Self Draw',
        value: 1,
        category: 'situational',
        description: '自己摸出胡牌之牌',
    },
    {
        id: 'concealed',
        name: '門前清',
        nameEn: 'Concealed Hand',
        value: 1,
        category: 'situational',
        description: '沒有上、碰、槓任何牌而胡牌',
        impliedBy: ['four-concealed-pungs', 'thirteen-orphans', 'nine-gates'],
    },
    {
        id: 'dragon-pung',
        name: '三元牌刻',
        nameEn: 'Dragon Pung',
        value: 1,
        category: 'honors',
        description: '擁有一副三元牌（中/發/白）刻子',
    },
    {
        id: 'seat-wind',
        name: '門風刻',
        nameEn: 'Seat Wind Pung',
        value: 1,
        category: 'honors',
        description: '擁有一副跟門風吻合的風牌刻子',
    },
    {
        id: 'round-wind',
        name: '圈風刻',
        nameEn: 'Round Wind Pung',
        value: 1,
        category: 'honors',
        description: '擁有一副跟圈風吻合的風牌刻子',
    },
    {
        id: 'robbing-kong',
        name: '搶槓',
        nameEn: 'Robbing the Kong',
        value: 1,
        category: 'situational',
        description: '聽牌時別家槓出自己所聽之牌，搶其槓胡牌',
    },
    {
        id: 'last-tile',
        name: '海底撈月',
        nameEn: 'Win on Last Tile',
        value: 1,
        category: 'situational',
        description: '摸全局最後一隻牌食糊',
    },

    // ============================================
    // 二番 (2 Fan)
    // ============================================
    {
        id: 'win-on-kong',
        name: '槓上開花',
        nameEn: 'Win on Kong',
        value: 2,
        category: 'situational',
        description: '明/暗/加槓後自摸（包含自摸1番）',
        includes: ['self-draw'],
    },
    {
        id: 'one-suit-flowers',
        name: '一臺花',
        nameEn: 'Full Set Flowers',
        value: 2,
        category: 'flowers',
        description: '集齊同一系列的花牌（梅蘭菊竹或春夏秋冬）',
    },

    // ============================================
    // 三番 (3 Fan)
    // ============================================
    {
        id: 'flower-win',
        name: '花胡',
        nameEn: 'Flower Win',
        value: 3,
        category: 'flowers',
        description: '集齊七隻花牌可即時胡牌（含自摸）',
        includes: ['self-draw'],
    },
    {
        id: 'all-pungs',
        name: '對對胡',
        nameEn: 'All Pungs',
        value: 3,
        category: 'triplets',
        description: '只有刻子的牌型',
        incompatibleWith: ['all-chows'],
        impliedBy: ['four-concealed-pungs', 'all-kongs', 'big-four-winds'],
    },
    {
        id: 'half-flush',
        name: '混一色',
        nameEn: 'Half Flush',
        value: 3,
        category: 'suits',
        description: '只有一門序數牌跟字牌',
        incompatibleWith: ['full-flush', 'all-honors'],
    },

    // ============================================
    // 四番 (4 Fan)
    // ============================================
    {
        id: 'mixed-terminals',
        name: '花么九',
        nameEn: 'Mixed Terminals',
        value: 4,
        category: 'terminals',
        description: '只有么九及字牌的對對胡',
        includes: ['all-pungs'],
        incompatibleWith: ['pure-terminals'],
    },

    // ============================================
    // 五番 (5 Fan)
    // ============================================
    {
        id: 'small-dragons',
        name: '小三元',
        nameEn: 'Small Three Dragons',
        value: 5,
        category: 'honors',
        description: '兩副三元牌刻子，一對三元牌將',
        incompatibleWith: ['big-dragons'],
    },

    // ============================================
    // 七番 (7 Fan)
    // ============================================
    {
        id: 'full-flush',
        name: '清一色',
        nameEn: 'Full Flush',
        value: 7,
        category: 'suits',
        description: '只有一門序數牌，沒有字牌',
        incompatibleWith: ['half-flush', 'all-honors'],
        includes: ['half-flush'],
    },

    // ============================================
    // 八番 (8 Fan)
    // ============================================
    {
        id: 'big-dragons',
        name: '大三元',
        nameEn: 'Big Three Dragons',
        value: 8,
        category: 'honors',
        description: '集齊中、發、白三個刻子',
        incompatibleWith: ['small-dragons'],
        includes: ['small-dragons'],
    },
    {
        id: 'double-kong-win',
        name: '連槓開花',
        nameEn: 'Double Kong Win',
        value: 8,
        category: 'situational',
        description: '連開超過一槓後自摸胡牌',
        includes: ['win-on-kong', 'self-draw'],
    },
    {
        id: 'eight-flowers',
        name: '大花胡',
        nameEn: 'Eight Flowers',
        value: 8,
        category: 'flowers',
        description: '摸齊八隻花可即時胡牌',
        includes: ['flower-win', 'self-draw'],
        isLimit: true,
    },
    {
        id: 'four-concealed-pungs',
        name: '坎坎胡',
        nameEn: 'Four Concealed Pungs',
        value: 8,
        category: 'triplets',
        description: '沒有碰、槓過的對對胡（四暗刻）',
        includes: ['all-pungs', 'concealed'],
        isLimit: true,
    },

    // ============================================
    // 九番 (9 Fan)
    // ============================================
    {
        id: 'small-four-winds',
        name: '小四喜',
        nameEn: 'Small Four Winds',
        value: 9,
        category: 'honors',
        description: '三副風牌刻子，一對風牌將',
        incompatibleWith: ['big-four-winds'],
    },

    // ============================================
    // 十番 (10 Fan) - 例牌
    // ============================================
    {
        id: 'all-honors',
        name: '字一色',
        nameEn: 'All Honors',
        value: 10,
        category: 'suits',
        description: '只有字牌的胡牌牌型',
        incompatibleWith: ['half-flush', 'full-flush'],
        isLimit: true,
    },
    {
        id: 'pure-terminals',
        name: '清么九',
        nameEn: 'Pure Terminals',
        value: 10,
        category: 'terminals',
        description: '只有么九牌的對對胡',
        includes: ['mixed-terminals', 'all-pungs'],
        incompatibleWith: ['mixed-terminals'],
        isLimit: true,
    },
    {
        id: 'nine-gates',
        name: '九蓮寶燈',
        nameEn: 'Nine Gates',
        value: 10,
        category: 'special',
        description: '門清狀態 1112345678999 同一花色',
        includes: ['full-flush', 'concealed'],
        isLimit: true,
    },

    // ============================================
    // 十三番 (13 Fan) - 例牌
    // ============================================
    {
        id: 'heavenly-win',
        name: '天胡',
        nameEn: 'Heavenly Win',
        value: 13,
        category: 'limit',
        description: '莊家開局補花後立即自摸',
        includes: ['self-draw'],
        isLimit: true,
    },
    {
        id: 'earthly-win',
        name: '地胡',
        nameEn: 'Earthly Win',
        value: 13,
        category: 'limit',
        description: '開局後，閒家食莊家打出的第一隻牌',
        isLimit: true,
    },
    {
        id: 'human-win',
        name: '人胡',
        nameEn: 'Human Win',
        value: 13,
        category: 'limit',
        description: '閒家於開局第一輪即自摸',
        includes: ['self-draw'],
        isLimit: true,
    },
    {
        id: 'big-four-winds',
        name: '大四喜',
        nameEn: 'Big Four Winds',
        value: 13,
        category: 'honors',
        description: '東、南、西、北四個刻子',
        includes: ['small-four-winds', 'all-pungs'],
        incompatibleWith: ['small-four-winds'],
        isLimit: true,
    },
    {
        id: 'thirteen-orphans',
        name: '十三么',
        nameEn: 'Thirteen Orphans',
        value: 13,
        category: 'special',
        description: '集齊六種么九牌及七種字牌，再加其中一張作將',
        isLimit: true,
    },
    {
        id: 'all-kongs',
        name: '十八羅漢',
        nameEn: 'Four Kongs',
        value: 13,
        category: 'special',
        description: '開了四個槓的胡牌牌型',
        includes: ['all-pungs'],
        isLimit: true,
    },

    // ============================================
    // 新章自訂牌型 (Custom Fan Types)
    // ============================================
    {
        id: 'two-identical-sequences',
        name: '一般高',
        nameEn: 'Two Identical Sequences',
        value: 1,
        category: 'basic',
        description: '兩副相同的同門順子',
        variant: 'custom',
    },
    {
        id: 'two-step-sequences',
        name: '一般低',
        nameEn: 'Two Step Sequences',
        value: 1,
        category: 'basic',
        description: '兩副同門的順子，數字遞進1',
        variant: 'custom',
    },
    {
        id: 'missing-suit',
        name: '缺一門',
        nameEn: 'Missing Suit',
        value: 1,
        category: 'suits',
        description: '牌型中缺少一種花色序數牌',
        variant: 'custom',
    },
    {
        id: 'three-identical-sequences',
        name: '三般高',
        nameEn: 'Three Identical Sequences',
        value: 2,
        category: 'basic',
        description: '三副相同的同門順子',
        variant: 'custom',
    },
    {
        id: 'three-step-sequences',
        name: '三般低',
        nameEn: 'Three Step Sequences',
        value: 2,
        category: 'basic',
        description: '三副同門的順子，依次遞進1',
        variant: 'custom',
    },
    {
        id: 'straight',
        name: '一條龍',
        nameEn: 'Straight',
        value: 2,
        category: 'suits',
        description: '擁有同門一至九的牌',
        variant: 'custom',
    },
    {
        id: 'seven-pairs',
        name: '七對子',
        nameEn: 'Seven Pairs',
        value: 3,
        category: 'special',
        description: '取得七個不同將',
        variant: 'custom',
    },
    {
        id: 'three-kongs',
        name: '三槓子',
        nameEn: 'Three Kongs',
        value: 3,
        category: 'triplets',
        description: '槓出三副牌',
        variant: 'custom',
    },
    {
        id: 'three-wind-pungs',
        name: '三喜臨門',
        nameEn: 'Three Wind Pungs',
        value: 3,
        category: 'honors',
        description: '牌型有三個風刻',
        variant: 'custom',
    },
    {
        id: 'four-identical-sequences',
        name: '四般高',
        nameEn: 'Four Identical Sequences',
        value: 3,
        category: 'basic',
        description: '四副相同的同門順子',
        variant: 'custom',
    },
    {
        id: 'all-green',
        name: '綠一色',
        nameEn: 'All Green',
        value: 13,
        category: 'special',
        description: '只有二、三、四、六、八條或發財',
        variant: 'custom',
        isLimit: true,
    },
    {
        id: 'all-blue',
        name: '藍一色',
        nameEn: 'All Blue',
        value: 13,
        category: 'special',
        description: '只有東、南、西、北、白板或八筒',
        variant: 'custom',
        isLimit: true,
    },
    {
        id: 'red-peacock',
        name: '紅孔雀',
        nameEn: 'Red Peacock',
        value: 13,
        category: 'special',
        description: '只有一、五、七、九條或紅中',
        variant: 'custom',
        isLimit: true,
    },
];

// ============================================
// 計分配置
// ============================================

export interface ScoringConfig {
    /** 每底幾分 */
    baseScore: number;
    /** 最少幾番先食得糊 */
    minFan: number;
    /** 封頂番數 */
    maxFan: number;
    /** 起始分數 */
    startingScore: number;
    /** 規則變體 */
    variant: RuleVariant;
    /** 計分模式：全銃 / 陪銃 */
    scoringMode: 'full' | 'half';
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
    baseScore: 1,
    minFan: 3,
    maxFan: 13,
    startingScore: 500,
    variant: 'standard',
    scoringMode: 'full',
};

// ============================================
// 優化：預計算 Lookup Maps (O(1) access)
// ============================================

/** Fan ID -> FanType lookup map */
const FAN_BY_ID = new Map<string, FanType>(
    CANTONESE_FAN_TYPES.map((fan) => [fan.id, fan])
);

/** Pre-filtered fans by variant */
const STANDARD_FANS = CANTONESE_FAN_TYPES.filter(
    (f) => !f.variant || f.variant === 'both' || f.variant === 'standard'
);

const CUSTOM_FANS = CANTONESE_FAN_TYPES.filter(
    (f) => f.variant === 'custom'
);

const ALL_FANS_FOR_STANDARD = CANTONESE_FAN_TYPES.filter(
    (f) => !f.variant || f.variant === 'both'
);

const ALL_FANS_FOR_CUSTOM = CANTONESE_FAN_TYPES.filter(
    (f) => !f.variant || f.variant === 'both' || f.variant === 'custom'
);

/** Limit fans */
const LIMIT_FANS = CANTONESE_FAN_TYPES.filter((f) => f.isLimit);

/** Common fan IDs for quick lookup */
const COMMON_FAN_IDS = new Set([
    'all-chows',
    'all-pungs',
    'half-flush',
    'full-flush',
    'self-draw',
    'concealed',
    'dragon-pung',
]);

/**
 * 快速取得番種 by ID (O(1))
 */
export function getFanById(id: string): FanType | undefined {
    return FAN_BY_ID.get(id);
}

/**
 * 取得適用於指定變體嘅所有番種 (cached)
 */
function getFansForVariant(variant: RuleVariant): FanType[] {
    return variant === 'standard' ? ALL_FANS_FOR_STANDARD : ALL_FANS_FOR_CUSTOM;
}

// ============================================
// 計分邏輯
// ============================================

/**
 * 計算番數對應嘅分數
 * 
 * 廣東牌傳統計法（四番滿糊半辣上）：
 * - 0台: 1
 * - 1番: 2
 * - 2台: 4
 * - 3台: 8
 * - 4台（滿糊）: 16
 * - 5台: 24
 * - 6台: 32
 * - 7台: 48
 * - 8台: 64
 * - 9台: 96
 * - 10台: 128
 * - 11番: 192
 * - 12台: 256
 * - 13台（爆棚）: 384
 * 
 * 簡化版：每番加倍（辣辣計）
 */
function calculateBasePoints(
    fan: number,
    baseScore: number,
    maxFan: number
): number {
    if (fan < 0) return 0;

    // 套用封頂
    const effectiveFan = Math.min(fan, maxFan);

    // 辣辣計：底 × 2^番數
    return baseScore * Math.pow(2, effectiveFan);
}

/**
 * 計算選擇咗嘅番種總番數（優化版）
 * 處理互斥、包含、暗示規則
 * 使用 Map lookup 代替 .find() 提升效能
 */
function calculateTotalFan(
    selectedFanIds: string[],
    variant: RuleVariant
): { totalFan: number; validFans: FanType[] } {
    const validFans: FanType[] = [];
    const includedIds = new Set<string>();
    const impliedIds = new Set<string>();
    const selectedSet = new Set(selectedFanIds);

    // Use cached fans for variant
    const availableFans = getFansForVariant(variant);
    const availableMap = new Map<string, FanType>(
        availableFans.map((f) => [f.id, f])
    );

    // 先收集所有「已包含」同「已暗示」嘅番
    for (const fanId of selectedFanIds) {
        const fan = availableMap.get(fanId);
        if (!fan) continue;

        if (fan.includes) {
            for (const id of fan.includes) {
                includedIds.add(id);
            }
        }
        if (fan.impliedBy) {
            for (const id of fan.impliedBy) {
                if (selectedSet.has(id)) {
                    impliedIds.add(fan.id);
                    break;
                }
            }
        }
    }

    // 計算有效番數
    let totalFan = 0;
    for (const fanId of selectedFanIds) {
        const fan = availableMap.get(fanId);
        if (!fan) continue;

        // 如果呢個番已經被其他番包含或暗示，唔計
        if (includedIds.has(fan.id) || impliedIds.has(fan.id)) continue;

        validFans.push(fan);
        totalFan += fan.value;
    }

    return { totalFan, validFans };
}

/**
 * 廣東牌計分主函數
 */
export function calculateCantoneseScore(
    params: ScoreCalculationParams,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoreResult {
    const { winType, winnerId, loserId, players, dealerId } = params;
    const { baseScore, maxFan, minFan, variant } = config;

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
        totalFan = params.fanCount;
        fanDescription = params.description || `${params.fanCount} 番`;
    } else {
        const { totalFan: calculatedFan, validFans } = calculateTotalFan(
            params.selectedFanIds,
            variant
        );
        totalFan = calculatedFan;
        fanDescription = validFans.map((f) => f.name).join('、') || '屁胡';
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
        let totalWinAmount = 0;

        for (const player of players) {
            if (player.id === winnerId) continue;

            let payment = basePoints;

            // 莊家贏或輸，加倍
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

        changes.push({
            playerId: winnerId,
            delta: totalWinAmount,
            newScore: winner.score + totalWinAmount,
        });

    } else {
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

        let payment = basePoints;

        // 莊家贏或輸，加倍
        if (isDealerWin || isDealerLose) {
            payment *= 2;
        }

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
 * Pro Mode 專用計分函數
 */
export function calculateScoreProMode(
    winType: WinType,
    winnerId: string,
    loserId: string | undefined,
    fanCount: number,
    players: Player[],
    dealerId: string,
    description?: string,
    config?: ScoringConfig
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
    }, config);
}

/**
 * Normal Mode 專用計分函數
 */
export function calculateScoreNormalMode(
    winType: WinType,
    winnerId: string,
    loserId: string | undefined,
    selectedFanIds: string[],
    players: Player[],
    dealerId: string,
    config?: ScoringConfig
): ScoreResult {
    return calculateCantoneseScore({
        mode: 'normal',
        winType,
        winnerId,
        loserId,
        selectedFanIds,
        players,
        dealerId,
    }, config);
}

// ============================================
// RuleSet 定義
// ============================================

export const CANTONESE_RULESET: RuleSet = {
    id: 'cantonese',
    name: '廣東牌',
    fanTypes: CANTONESE_FAN_TYPES,
    baseScore: 1,
    minFan: 3,
    maxFan: 13,
    startingScore: 500,
    calculateScore: calculateCantoneseScore,
};

// ============================================
// 輔助函數（已優化）
// ============================================

/**
 * 按分類取得番種（使用 cached variant arrays）
 */
export function getFansByCategory(
    category: FanCategory,
    variant: RuleVariant = 'standard'
): FanType[] {
    const fans = getFansForVariant(variant);
    return fans.filter((f) => f.category === category);
}

/**
 * 取得常用番種（使用 Set 做 O(1) lookup）
 */
export function getCommonFans(variant: RuleVariant = 'standard'): FanType[] {
    const fans = getFansForVariant(variant);
    return fans.filter((f) => COMMON_FAN_IDS.has(f.id));
}

/**
 * 取得所有標準番種（cached）
 */
export function getStandardFans(): FanType[] {
    return STANDARD_FANS;
}

/**
 * 取得所有新章番種（cached）
 */
export function getCustomFans(): FanType[] {
    return CUSTOM_FANS;
}

/**
 * 取得所有例牌（cached）
 */
export function getLimitFans(): FanType[] {
    return LIMIT_FANS;
}

/**
 * 檢查番種組合係咪有效（使用 Map lookup）
 */
export function validateFanCombination(
    fanIds: string[]
): { valid: boolean; conflicts: string[][] } {
    const conflicts: string[][] = [];

    for (let i = 0; i < fanIds.length; i++) {
        const fan = FAN_BY_ID.get(fanIds[i]);
        if (!fan?.incompatibleWith) continue;

        for (let j = i + 1; j < fanIds.length; j++) {
            if (fan.incompatibleWith.includes(fanIds[j])) {
                const conflictFan = FAN_BY_ID.get(fanIds[j]);
                conflicts.push([fan.name, conflictFan?.name || fanIds[j]]);
            }
        }
    }

    return {
        valid: conflicts.length === 0,
        conflicts,
    };
}
