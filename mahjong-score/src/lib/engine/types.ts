/**
 * 🀄 Mahjong Score App - Core Type Definitions
 * 
 * 呢個檔案定義咗成個 app 嘅核心類型。
 * 所有計分邏輯都建基於呢啲類型。
 */

// ============================================
// 風位 (Wind Position)
// ============================================

/** 四個風位 */
export type Wind = 'east' | 'south' | 'west' | 'north';

/** 風位順序（東南西北） */
export const WIND_ORDER: readonly Wind[] = ['east', 'south', 'west', 'north'] as const;

/** 風位中文名 */
export const WIND_NAMES: Record<Wind, string> = {
    east: '東',
    south: '南',
    west: '西',
    north: '北',
};

/** 取得下一個風位 */
export function getNextWind(wind: Wind): Wind {
    const index = WIND_ORDER.indexOf(wind);
    return WIND_ORDER[(index + 1) % 4];
}

// ============================================
// 玩家 (Player)
// ============================================

/** 玩家顏色（用於 UI 識別） */
export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

/** 玩家座位（固定，by index 0-3） */
export type SeatIndex = 0 | 1 | 2 | 3;

/** 玩家資料 */
export interface Player {
    /** 唯一 ID */
    id: string;
    /** 玩家名稱 */
    name: string;
    /** 當前分數 */
    score: number;
    /** 座位 index (0-3)，固定唔變 */
    seatIndex: SeatIndex;
    /** 顏色（用於 UI） */
    color: PlayerColor;
}

/** 預設玩家顏色 */
export const SEAT_COLORS: Record<SeatIndex, PlayerColor> = {
    0: 'red',
    1: 'blue',
    2: 'green',
    3: 'yellow',
};

// ============================================
// 番種 (Fan Types)
// ============================================

/**
 * 規則變體
 * - standard: 清章（正統牌型）
 * - custom: 新章（加入自訂牌型）
 */
export type RuleVariant = 'standard' | 'custom';

/** 番種分類 */
export type FanCategory =
    | 'basic'        // 基本（屁胡、平糊）
    | 'triplets'     // 刻子相關（對對糊等）
    | 'suits'        // 花色相關（清一色、混一色）
    | 'honors'       // 字牌相關（三元、四喜）
    | 'terminals'    // 么九相關（花么九、清么九）
    | 'special'      // 特殊（十三么、七對）
    | 'situational'  // 情景（自摸、門清、海底等）
    | 'flowers'      // 花牌相關
    | 'limit';       // 例牌（爆棚）

/** 番種定義 */
export interface FanType {
    /** 唯一 ID */
    id: string;
    /** 中文名 */
    name: string;
    /** 英文名 */
    nameEn: string;
    /** 番數（台數） */
    value: number;
    /** 分類 */
    category: FanCategory;
    /** 描述（用於 tooltip） */
    description: string;
    /** 
     * 規則變體
     * - 'standard': 只喺清章有效
     * - 'custom': 只喺新章有效
     * - 'both': 兩種都有效（預設）
     */
    variant?: 'standard' | 'custom' | 'both';
    /** 係咪例牌（爆棚） */
    isLimit?: boolean;
    /** 唔可以同時計嘅番（互斥） */
    incompatibleWith?: string[];
    /** 已經包含嘅番（疊加時唔重複計） */
    includes?: string[];
    /** 必然伴隨嘅番（唔另計） */
    impliedBy?: string[];
}

// ============================================
// 牌制 (Rule Set)
// ============================================

/** 支援嘅牌制 ID */
export type RuleSetId = 'cantonese' | 'sichuan' | 'taiwan';

/** 牌制名稱 */
export const RULESET_NAMES: Record<RuleSetId, string> = {
    cantonese: '廣東牌',
    sichuan: '四川牌',
    taiwan: '台灣牌',
};

/** 牌制定義 */
export interface RuleSet {
    /** 牌制 ID */
    id: RuleSetId;
    /** 中文名 */
    name: string;
    /** 所有番種 */
    fanTypes: FanType[];
    /** 每底幾分 */
    baseScore: number;
    /** 最少幾番先食得糊 */
    minFan: number;
    /** 封頂番數 */
    maxFan: number;
    /** 起始分數 */
    startingScore: number;
    /** 計分邏輯 */
    calculateScore: (params: ScoreCalculationParams) => ScoreResult;
}

// ============================================
// 計分 (Scoring)
// ============================================

/** 食糊方式 */
export type WinType = 'self-draw' | 'discard';

/** 
 * 輸入模式
 * - pro: 入分模式 - 直接輸入番數（老手用）
 * - normal: 計番模式 - 揀牌型計番（新手用）
 */
export type InputMode = 'pro' | 'normal';

/** Pro Mode 計分參數（直接輸入番數） */
export interface ProModeScoreParams {
    /** 輸入模式 */
    mode: 'pro';
    /** 食糊方式 */
    winType: WinType;
    /** 贏家 ID */
    winnerId: string;
    /** 出銃者 ID（只有 discard 時有） */
    loserId?: string;
    /** 直接輸入嘅番數 */
    fanCount: number;
    /** 描述（可選，e.g. "清一色"） */
    description?: string;
    /** 所有玩家 */
    players: Player[];
    /** 當前莊家 ID */
    dealerId: string;
}

/** Normal Mode 計分參數（揀牌型計番） */
export interface NormalModeScoreParams {
    /** 輸入模式 */
    mode: 'normal';
    /** 食糊方式 */
    winType: WinType;
    /** 贏家 ID */
    winnerId: string;
    /** 出銃者 ID（只有 discard 時有） */
    loserId?: string;
    /** 選擇咗嘅番種 ID */
    selectedFanIds: string[];
    /** 所有玩家 */
    players: Player[];
    /** 當前莊家 ID */
    dealerId: string;
}

/** 計分參數（兩種模式） */
export type ScoreCalculationParams = ProModeScoreParams | NormalModeScoreParams;

/** Legacy 兼容：直接用 selectedFanIds 嘅參數 */
export interface LegacyScoreParams {
    winType: WinType;
    winnerId: string;
    loserId?: string;
    selectedFanIds: string[];
    players: Player[];
    dealerId: string;
}

/** 單個玩家嘅分數變化 */
export interface ScoreChange {
    /** 玩家 ID */
    playerId: string;
    /** 分數變化（正數 = 贏，負數 = 輸） */
    delta: number;
    /** 變化後嘅新分數 */
    newScore: number;
}

/** 計分結果 */
export interface ScoreResult {
    /** 總番數 */
    totalFan: number;
    /** 基本分數（未計莊家加倍） */
    basePoints: number;
    /** 番種描述（e.g. "清一色、對對糊"） */
    fanDescription: string;
    /** 每個玩家嘅分數變化 */
    changes: ScoreChange[];
    /** 係咪莊家食糊 */
    isDealerWin: boolean;
    /** 錯誤信息（如有） */
    error?: string;
}

// ============================================
// 局數 (Round)
// ============================================

/** 一局嘅結果 */
export type RoundOutcome =
    | { type: 'win'; result: ScoreResult }
    | { type: 'draw' }; // 流局

/** 一局嘅紀錄 */
export interface Round {
    /** 唯一 ID */
    id: string;
    /** 第幾局（1-based） */
    roundNumber: number;
    /** 圈風（東風圈、南風圈等） */
    roundWind: Wind;
    /** 莊家座位 */
    dealerSeatIndex: SeatIndex;
    /** 結果 */
    outcome: RoundOutcome;
    /** 時間戳 */
    timestamp: number;
}

// ============================================
// 遊戲狀態 (Game State)
// ============================================

/** 遊戲狀態（整個 session） */
export interface GameState {
    /** 唯一 ID */
    id: string;
    /** 使用嘅牌制 */
    ruleSetId: RuleSetId;
    /** 四位玩家 */
    players: [Player, Player, Player, Player];
    /** 當前莊家座位 index */
    dealerSeatIndex: SeatIndex;
    /** 當前圈風 */
    roundWind: Wind;
    /** 當前局數（總計） */
    roundNumber: number;
    /** 連莊次數 */
    dealerContinueCount: number;
    /** 歷史記錄 */
    history: Round[];
    /** 建立時間 */
    createdAt: number;
    /** 最後更新時間 */
    updatedAt: number;
}

// ============================================
// UI 狀態 (Win Flow)
// ============================================

/** 
 * Pro Mode 食糊流程步驟
 * 流程：揀贏家 → 揀食糊方式 → (如出銃)揀出銃者 → 輸入番數 → 確認
 */
export type ProModeWinFlowStep =
    | 'select-winner'    // 揀邊個食糊
    | 'select-win-type'  // 自摸定出銃
    | 'select-loser'     // 揀邊個出銃（只有 discard）
    | 'input-fan'        // 輸入番數
    | 'confirm';         // 確認

/** 
 * Normal Mode 食糊流程步驟
 * 流程：揀贏家 → 揀食糊方式 → (如出銃)揀出銃者 → 揀牌型 → 確認
 */
export type NormalModeWinFlowStep =
    | 'select-winner'    // 揀邊個食糊
    | 'select-win-type'  // 自摸定出銃
    | 'select-loser'     // 揀邊個出銃（只有 discard）
    | 'select-fans'      // 揀番種
    | 'confirm';         // 確認

/** 食糊流程步驟（通用） */
export type WinFlowStep = ProModeWinFlowStep | NormalModeWinFlowStep;

/** Pro Mode 食糊流程狀態 */
export interface ProModeWinFlowState {
    /** 輸入模式 */
    mode: 'pro';
    /** 當前步驟 */
    step: ProModeWinFlowStep;
    /** 贏家 ID */
    winnerId: string | null;
    /** 食糊方式 */
    winType: WinType | null;
    /** 出銃者 ID */
    loserId: string | null;
    /** 直接輸入嘅番數 */
    fanCount: number | null;
    /** 描述（可選） */
    description: string;
    /** 預覽結果 */
    previewResult: ScoreResult | null;
}

/** Normal Mode 食糊流程狀態 */
export interface NormalModeWinFlowState {
    /** 輸入模式 */
    mode: 'normal';
    /** 當前步驟 */
    step: NormalModeWinFlowStep;
    /** 贏家 ID */
    winnerId: string | null;
    /** 食糊方式 */
    winType: WinType | null;
    /** 出銃者 ID */
    loserId: string | null;
    /** 已選番種 ID */
    selectedFanIds: string[];
    /** 預覽結果 */
    previewResult: ScoreResult | null;
}

/** 食糊流程狀態（兩種模式） */
export type WinFlowState = ProModeWinFlowState | NormalModeWinFlowState;

/** 建立初始 Pro Mode 狀態 */
export function createProModeFlowState(): ProModeWinFlowState {
    return {
        mode: 'pro',
        step: 'select-winner',
        winnerId: null,
        winType: null,
        loserId: null,
        fanCount: null,
        description: '',
        previewResult: null,
    };
}

/** 建立初始 Normal Mode 狀態 */
export function createNormalModeFlowState(): NormalModeWinFlowState {
    return {
        mode: 'normal',
        step: 'select-winner',
        winnerId: null,
        winType: null,
        loserId: null,
        selectedFanIds: [],
        previewResult: null,
    };
}

// ============================================
// Helper Functions
// ============================================

/** 產生隨機 ID */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

/** 建立新玩家 */
export function createPlayer(
    name: string,
    seatIndex: SeatIndex,
    startingScore: number
): Player {
    return {
        id: generateId(),
        name,
        score: startingScore,
        seatIndex,
        color: SEAT_COLORS[seatIndex],
    };
}

/** 建立四位玩家 */
export function createPlayers(
    names: [string, string, string, string],
    startingScore: number
): [Player, Player, Player, Player] {
    return [
        createPlayer(names[0], 0, startingScore),
        createPlayer(names[1], 1, startingScore),
        createPlayer(names[2], 2, startingScore),
        createPlayer(names[3], 3, startingScore),
    ];
}
