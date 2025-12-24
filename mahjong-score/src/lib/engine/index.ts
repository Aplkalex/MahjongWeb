/**
 * 🀄 Mahjong Scoring Engine
 * 
 * 呢個模組係成個 app 嘅心臟。
 * 純邏輯，冇 React，可以獨立測試。
 * 
 * 支援：
 * - 兩種輸入模式：Pro Mode / Normal Mode
 * - 兩種規則變體：清章 / 新章
 * - 完整番種表（根據 Wikipedia）
 */

// 核心類型
export * from './types';

// 廣東牌規則
export {
    CANTONESE_RULESET,
    CANTONESE_FAN_TYPES,
    DEFAULT_SCORING_CONFIG,
    CONFIG_25_CHICKEN,
    CONFIG_51,
    CONFIG_12,
    calculateCantoneseScore,
    calculateScoreProMode,
    calculateScoreNormalMode,
    getFanById,
    getFansByCategory,
    getCommonFans,
    getStandardFans,
    getCustomFans,
    getLimitFans,
    validateFanCombination,
} from './cantonese';

export type { ScoringConfig, PaymentMode, EscalationMode } from './cantonese';

// 導入所有牌制
import { CANTONESE_RULESET } from './cantonese';
import type { RuleSet, RuleSetId } from './types';

/**
 * 所有支援嘅牌制
 */
export const RULE_SETS: Record<RuleSetId, RuleSet> = {
    cantonese: CANTONESE_RULESET,
    // TODO: Phase 5 - 加入其他牌制
    sichuan: CANTONESE_RULESET, // Placeholder
    taiwan: CANTONESE_RULESET,  // Placeholder
};

/**
 * 取得指定牌制
 */
export function getRuleSet(id: RuleSetId): RuleSet {
    return RULE_SETS[id];
}

/**
 * 取得所有牌制
 */
export function getAllRuleSets(): RuleSet[] {
    return [CANTONESE_RULESET];
}
