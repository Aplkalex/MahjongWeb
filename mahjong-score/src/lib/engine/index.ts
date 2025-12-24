/**
 * 🀄 Mahjong Scoring Engine
 * 
 * 呢個模組係成個 app 嘅心臟。
 * 純邏輯，冇 React，可以獨立測試。
 * 
 * 支援兩種輸入模式：
 * - Pro Mode: 直接輸入番數（老手用）
 * - Normal Mode: 揀牌型計番（新手用）
 */

// 核心類型
export * from './types';

// 廣東牌規則
export {
    CANTONESE_RULESET,
    CANTONESE_FAN_TYPES,
    calculateCantoneseScore,
    calculateScoreProMode,
    calculateScoreNormalMode,
    getFansByCategory,
    getCommonFans,
    validateFanCombination,
} from './cantonese';

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
 * 取得所有牌制（用於選擇畫面）
 */
export function getAllRuleSets(): RuleSet[] {
    // 只返回真正實現咗嘅牌制
    return [CANTONESE_RULESET];
}
