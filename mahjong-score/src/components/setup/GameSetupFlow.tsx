"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { MotionButton } from "@/components/ui/MotionButton";
import { cn } from "@/lib/utils";
import { 
    ArrowLeft, 
    ArrowRight, 
    Check, 
    Users, 
    Settings2, 
    Gamepad2,
    Sparkles
} from "lucide-react";
import { RuleSetId, RULESET_NAMES } from "@/lib/engine/types";
import NumberFlow from "@number-flow/react";

interface GameSetupFlowProps {
    isOpen: boolean;
    onComplete: () => void;
    onCancel: () => void;
}

type SetupStep = 'rules' | 'players' | 'settings';

const STEPS: SetupStep[] = ['rules', 'players', 'settings'];

const STEP_INFO: Record<SetupStep, { title: string; icon: React.ReactNode }> = {
    rules: { title: '選擇牌制', icon: <Gamepad2 size={20} /> },
    players: { title: '玩家設定', icon: <Users size={20} /> },
    settings: { title: '遊戲設定', icon: <Settings2 size={20} /> },
};

const RULE_DESCRIPTIONS: Record<RuleSetId, string> = {
    cantonese: '香港/廣東最常見嘅打法',
    sichuan: '四川血戰到底（開發中）',
    taiwan: '台灣十六張麻將（開發中）',
};

const STARTING_SCORE_PRESETS = [
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '2000', value: 2000 },
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

export function GameSetupFlow({ isOpen, onComplete, onCancel }: GameSetupFlowProps) {
    const settings = useGameStore(state => state.settings);
    const updateSettings = useGameStore(state => state.updateSettings);
    const startGame = useGameStore(state => state.startGame);

    const [step, setStep] = useState<SetupStep>('rules');
    const [direction, setDirection] = useState(0);
    
    // Local state for setup
    const [ruleSet, setRuleSet] = useState<RuleSetId>(settings.ruleSetId);
    const [playerNames, setPlayerNames] = useState<[string, string, string, string]>(
        settings.playerNames
    );
    const [startingScore, setStartingScore] = useState(settings.startingScore);

    const currentStepIndex = STEPS.indexOf(step);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    const goNext = () => {
        if (!isLastStep) {
            setDirection(1);
            setStep(STEPS[currentStepIndex + 1]);
        }
    };

    const goBack = () => {
        if (!isFirstStep) {
            setDirection(-1);
            setStep(STEPS[currentStepIndex - 1]);
        }
    };

    const handleComplete = () => {
        updateSettings({
            ruleSetId: ruleSet,
            playerNames,
            startingScore,
        });
        startGame({
            ruleSetId: ruleSet,
            playerNames,
            startingScore,
        });
        onComplete();
    };

    const updatePlayerName = (index: number, name: string) => {
        const newNames = [...playerNames] as [string, string, string, string];
        newNames[index] = name;
        setPlayerNames(newNames);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-lg p-6 overflow-hidden"
            >
                {/* Header with Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="text-primary" size={24} />
                            新遊戲
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            取消
                        </button>
                    </div>
                    
                    {/* Step Progress */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={s} className="flex items-center flex-1">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                        i <= currentStepIndex
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {i < currentStepIndex ? (
                                        <Check size={16} />
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            "flex-1 h-1 mx-2 rounded-full transition-all",
                                            i < currentStepIndex ? "bg-primary" : "bg-muted"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Step Title */}
                    <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                        {STEP_INFO[step].icon}
                        <span>{STEP_INFO[step].title}</span>
                    </div>
                </div>

                {/* Step Content */}
                <div className="relative min-h-[300px]">
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* Step 1: Rule Selection */}
                        {step === 'rules' && (
                            <motion.div
                                key="rules"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-3"
                            >
                                {(Object.keys(RULESET_NAMES) as RuleSetId[]).map((id) => {
                                    const isDisabled = id !== 'cantonese';
                                    return (
                                        <motion.button
                                            key={id}
                                            whileHover={!isDisabled ? { scale: 1.02 } : {}}
                                            whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                            onClick={() => !isDisabled && setRuleSet(id)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "w-full p-4 rounded-xl text-left transition-all",
                                                ruleSet === id
                                                    ? "bg-primary text-primary-foreground ring-2 ring-primary"
                                                    : "glass-card hover:ring-2 hover:ring-primary/50",
                                                isDisabled && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="font-bold text-lg">
                                                {RULESET_NAMES[id]}
                                                {isDisabled && (
                                                    <span className="ml-2 text-xs opacity-70">
                                                        (即將推出)
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "text-sm mt-1",
                                                ruleSet === id ? "opacity-80" : "text-muted-foreground"
                                            )}>
                                                {RULE_DESCRIPTIONS[id]}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}

                        {/* Step 2: Player Setup */}
                        {step === 'players' && (
                            <motion.div
                                key="players"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-3"
                            >
                                {['東', '南', '西', '北'].map((wind, index) => (
                                    <div
                                        key={index}
                                        className="glass-card p-4 flex items-center gap-4"
                                    >
                                        <div className={cn(
                                            "wind-badge",
                                            `wind-${['east', 'south', 'west', 'north'][index]}`
                                        )}>
                                            {wind}
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground">
                                                玩家 {index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={playerNames[index]}
                                                onChange={(e) => updatePlayerName(index, e.target.value)}
                                                placeholder={`玩家 ${index + 1}`}
                                                className="w-full bg-transparent border-b border-white/20 focus:border-primary outline-none py-1 text-lg font-medium transition-colors"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Step 3: Game Settings */}
                        {step === 'settings' && (
                            <motion.div
                                key="settings"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-6"
                            >
                                {/* Starting Score */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                                        起始分數
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {STARTING_SCORE_PRESETS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                onClick={() => setStartingScore(preset.value)}
                                                className={cn(
                                                    "p-3 rounded-xl text-center font-bold transition-all",
                                                    startingScore === preset.value
                                                        ? "bg-primary text-primary-foreground"
                                                        : "glass-card hover:ring-2 hover:ring-primary/50"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="glass-card p-4 flex items-center gap-4">
                                        <span className="text-muted-foreground">自訂：</span>
                                        <input
                                            type="number"
                                            value={startingScore}
                                            onChange={(e) => setStartingScore(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="flex-1 bg-transparent border-b border-white/20 focus:border-primary outline-none py-1 text-2xl font-mono font-bold text-center transition-colors"
                                            min={0}
                                            step={100}
                                        />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="glass-card p-4">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                                        遊戲摘要
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">牌制</span>
                                            <span className="font-medium">{RULESET_NAMES[ruleSet]}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">玩家</span>
                                            <span className="font-medium">
                                                {playerNames.filter(n => n.trim()).join(', ')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">起始分數</span>
                                            <span className="font-mono font-bold text-primary">
                                                <NumberFlow value={startingScore} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <MotionButton
                        variant="ghost"
                        onClick={goBack}
                        disabled={isFirstStep}
                        className={cn(
                            "gap-2",
                            isFirstStep && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ArrowLeft size={18} />
                        上一步
                    </MotionButton>

                    {isLastStep ? (
                        <MotionButton
                            variant="primary"
                            onClick={handleComplete}
                            size="lg"
                            className="gap-2"
                        >
                            <Sparkles size={18} />
                            開始遊戲
                        </MotionButton>
                    ) : (
                        <MotionButton
                            variant="primary"
                            onClick={goNext}
                            className="gap-2"
                        >
                            下一步
                            <ArrowRight size={18} />
                        </MotionButton>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
