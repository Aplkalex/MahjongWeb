"use client";

import { useGameStore } from "@/stores/gameStore";
import { KnobControl } from "@/components/ui/KnobControl";
import { MotionButton } from "@/components/ui/MotionButton";
import { FanSelector } from "./FanSelector";
import { useState, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Player, ScoreResult, InputMode } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Hand, Users, Zap, TrendingUp, TrendingDown, List, Gauge } from "lucide-react";
import { calculateCantoneseScore, CANTONESE_FAN_TYPES } from "@/lib/engine/cantonese";

type WinStep = 'select-winner' | 'win-type' | 'select-discarder' | 'input-fan' | 'select-fans' | 'confirm';

const WIND_LABELS: Record<string, string> = {
    east: "東",
    south: "南",
    west: "西",
    north: "北"
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 200 : -200,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 200 : -200,
        opacity: 0,
    }),
};

export function WinFlowOverlay() {
    const winFlow = useGameStore(state => state.winFlow);
    const cancelWinFlow = useGameStore(state => state.cancelWinFlow);
    const game = useGameStore(state => state.game);
    const settings = useGameStore(state => state.settings);
    const recordWin = useGameStore(state => state.recordWin);
    const preferredInputMode = useGameStore(state => state.preferredInputMode);

    const [step, setStep] = useState<WinStep>('select-winner');
    const [direction, setDirection] = useState(0);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [isSelfDraw, setIsSelfDraw] = useState(true);
    const [discarderId, setDiscarderId] = useState<string | null>(null);
    const [fan, setFan] = useState(3);
    const [selectedFanIds, setSelectedFanIds] = useState<string[]>([]);
    
    // Current mode - from winFlow or preferred
    const currentMode: InputMode = winFlow?.mode || preferredInputMode;

    // Track if this is a real click vs a drag release (must be before early return)
    const [isPointerDown, setIsPointerDown] = useState(false);
    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

    // Calculate total fan from selected fans (for normal mode)
    const normalModeFan = useMemo(() => {
        return selectedFanIds.reduce((sum, id) => {
            const fanType = CANTONESE_FAN_TYPES.find(f => f.id === id);
            return sum + (fanType?.value || 0);
        }, 0);
    }, [selectedFanIds]);

    if (!winFlow || !game) return null;

    const { players, dealerSeatIndex } = game;
    const maxFan = settings.scoringConfig.maxFan;

    // Calculate preview result based on mode
    const previewResult = useMemo<ScoreResult | null>(() => {
        if (!winnerId) return null;
        const dealerId = players[dealerSeatIndex].id;
        
        try {
            if (currentMode === 'pro') {
                const effectiveFan = Math.min(fan, maxFan);
                return calculateCantoneseScore({
                    mode: 'pro',
                    winType: isSelfDraw ? 'self-draw' : 'discard',
                    winnerId: winnerId,
                    loserId: isSelfDraw ? undefined : discarderId || undefined,
                    fanCount: effectiveFan,
                    players,
                    dealerId,
                }, settings.scoringConfig);
            } else {
                // Normal mode - calculate from selected fans
                return calculateCantoneseScore({
                    mode: 'normal',
                    winType: isSelfDraw ? 'self-draw' : 'discard',
                    winnerId: winnerId,
                    loserId: isSelfDraw ? undefined : discarderId || undefined,
                    selectedFanIds: selectedFanIds,
                    players,
                    dealerId,
                }, settings.scoringConfig);
            }
        } catch {
            return null;
        }
    }, [winnerId, fan, maxFan, isSelfDraw, discarderId, players, dealerSeatIndex, settings.scoringConfig, currentMode, selectedFanIds]);

    const goNext = (nextStep: WinStep) => {
        setDirection(1);
        setStep(nextStep);
    };

    const goBack = (prevStep: WinStep) => {
        setDirection(-1);
        setStep(prevStep);
    };

    const handleSelectWinner = (playerId: string) => {
        setWinnerId(playerId);
        goNext('win-type');
    };

    const handleWinType = (selfDraw: boolean) => {
        setIsSelfDraw(selfDraw);
        if (selfDraw) {
            // Go to input step based on mode
            goNext(currentMode === 'pro' ? 'input-fan' : 'select-fans');
        } else {
            goNext('select-discarder');
        }
    };

    const handleSelectDiscarder = (playerId: string) => {
        setDiscarderId(playerId);
        // Go to input step based on mode
        goNext(currentMode === 'pro' ? 'input-fan' : 'select-fans');
    };

    const handleFanSelectionChange = useCallback((fanIds: string[]) => {
        setSelectedFanIds(fanIds);
    }, []);

    const handleConfirm = () => {
        const winnerIdx = players.findIndex(p => p.id === winnerId);
        const dealerId = players[dealerSeatIndex].id;

        let result: ScoreResult;
        let description: string;

        if (currentMode === 'pro') {
            const effectiveFan = Math.min(fan, maxFan);
            result = calculateCantoneseScore({
                mode: 'pro',
                winType: isSelfDraw ? 'self-draw' : 'discard',
                winnerId: winnerId!,
                loserId: isSelfDraw ? undefined : discarderId!,
                fanCount: effectiveFan,
                players,
                dealerId,
            }, settings.scoringConfig);
            description = `${players[winnerIdx].name} ${isSelfDraw ? '自摸' : '出銃'} ${effectiveFan}番`;
        } else {
            result = calculateCantoneseScore({
                mode: 'normal',
                winType: isSelfDraw ? 'self-draw' : 'discard',
                winnerId: winnerId!,
                loserId: isSelfDraw ? undefined : discarderId!,
                selectedFanIds: selectedFanIds,
                players,
                dealerId,
            }, settings.scoringConfig);
            // Build description from selected fans
            const fanNames = selectedFanIds
                .map(id => CANTONESE_FAN_TYPES.find(f => f.id === id)?.name)
                .filter(Boolean)
                .slice(0, 3)
                .join('、');
            description = `${players[winnerIdx].name} ${isSelfDraw ? '自摸' : '出銃'} ${result.totalFan}番 (${fanNames}${selectedFanIds.length > 3 ? '...' : ''})`;
        }

        // Record the win with the calculated result
        recordWin(result, description);

        // Reset and close
        setStep('select-winner');
        setWinnerId(null);
        setDiscarderId(null);
        setFan(3);
        setSelectedFanIds([]);
        cancelWinFlow();
    };

    const handleClose = () => {
        setStep('select-winner');
        setWinnerId(null);
        setDiscarderId(null);
        setFan(3);
        setSelectedFanIds([]);
        cancelWinFlow();
    };

    const getWind = (idx: number) => {
        const windIdx = (idx - dealerSeatIndex + 4) % 4;
        const winds: ('east' | 'south' | 'west' | 'north')[] = ['east', 'south', 'west', 'north'];
        return winds[windIdx];
    };

    const winner = players.find(p => p.id === winnerId);

    const handleBackdropPointerDown = (e: React.PointerEvent) => {
        // Only track if clicking directly on backdrop, not on children
        if (e.target === e.currentTarget) {
            setIsPointerDown(true);
            pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleBackdropPointerUp = (e: React.PointerEvent) => {
        // Only close if clicking directly on backdrop
        if (e.target !== e.currentTarget) {
            return;
        }

        if (!isPointerDown || !pointerDownPos.current) {
            setIsPointerDown(false);
            return;
        }

        // Only close if pointer hasn't moved much (real click, not drag release)
        const dx = Math.abs(e.clientX - pointerDownPos.current.x);
        const dy = Math.abs(e.clientY - pointerDownPos.current.y);
        const isClick = dx < 10 && dy < 10;

        if (isClick) {
            handleClose();
        }

        setIsPointerDown(false);
        pointerDownPos.current = null;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onPointerDown={handleBackdropPointerDown}
                onPointerUp={handleBackdropPointerUp}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="glass-card w-full max-w-md p-6 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        {step !== 'select-winner' && (
                            <button
                                onClick={() => {
                                    if (step === 'win-type') goBack('select-winner');
                                    else if (step === 'select-discarder') goBack('win-type');
                                    else if (step === 'input-fan') goBack(isSelfDraw ? 'win-type' : 'select-discarder');
                                    else if (step === 'select-fans') goBack(isSelfDraw ? 'win-type' : 'select-discarder');
                                    else if (step === 'confirm') goBack(currentMode === 'pro' ? 'input-fan' : 'select-fans');
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-xl font-bold flex-1 text-center">
                            {step === 'select-winner' && '邊個食糊？'}
                            {step === 'win-type' && '自摸定出銃？'}
                            {step === 'select-discarder' && '邊個出銃？'}
                            {step === 'input-fan' && '幾多番？'}
                            {step === 'select-fans' && '揀牌型'}
                            {step === 'confirm' && '確認'}
                        </h2>
                        <div className="w-9" /> {/* Spacer */}
                    </div>

                    {/* Content Area with Slide Animation */}
                    <div className="relative min-h-[280px]">
                        <AnimatePresence mode="wait" custom={direction}>
                            {/* Step 1: Select Winner */}
                            {step === 'select-winner' && (
                                <motion.div
                                    key="select-winner"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {players.map((p, idx) => (
                                        <motion.button
                                            key={p.id}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleSelectWinner(p.id)}
                                            className={cn(
                                                "glass-card p-4 flex flex-col items-center gap-2",
                                                `wind-${getWind(idx)}`,
                                                "hover:ring-2 hover:ring-primary transition-all"
                                            )}
                                        >
                                            <div className={cn("wind-badge", `wind-${getWind(idx)}`)}>
                                                {WIND_LABELS[getWind(idx)]}
                                            </div>
                                            <span className="font-medium">{p.name}</span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Step 2: Win Type */}
                            {step === 'win-type' && (
                                <motion.div
                                    key="win-type"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="text-center text-muted-foreground mb-2">
                                        {winner?.name} 係點樣食嘅？
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleWinType(true)}
                                        className="glass-card p-5 flex items-center gap-4 hover:ring-2 hover:ring-secondary transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                                            <Zap size={24} className="text-secondary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">自摸</div>
                                            <div className="text-sm text-muted-foreground">其他三家畀錢</div>
                                        </div>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleWinType(false)}
                                        className="glass-card p-5 flex items-center gap-4 hover:ring-2 hover:ring-primary transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Hand size={24} className="text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">出銃</div>
                                            <div className="text-sm text-muted-foreground">打出嗰個畀錢</div>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Step 3: Select Discarder */}
                            {step === 'select-discarder' && (
                                <motion.div
                                    key="select-discarder"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="grid grid-cols-3 gap-3"
                                >
                                    {players.filter(p => p.id !== winnerId).map((p, idx) => {
                                        const originalIdx = players.findIndex(pl => pl.id === p.id);
                                        return (
                                            <motion.button
                                                key={p.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSelectDiscarder(p.id)}
                                                className={cn(
                                                    "glass-card p-4 flex flex-col items-center gap-2",
                                                    "hover:ring-2 hover:ring-primary transition-all"
                                                )}
                                            >
                                                <div className={cn("wind-badge", `wind-${getWind(originalIdx)}`)}>
                                                    {WIND_LABELS[getWind(originalIdx)]}
                                                </div>
                                                <span className="font-medium text-sm">{p.name}</span>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* Step 4: Input Fan */}
                            {step === 'input-fan' && (
                                <motion.div
                                    key="input-fan"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <KnobControl
                                        value={fan}
                                        onChange={setFan}
                                        min={0}
                                        max={18}
                                    />
                                    
                                    {/* Quick preview of winner's gain */}
                                    {previewResult && (
                                        <motion.div
                                            key={previewResult.changes.find(c => c.delta > 0)?.delta}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-center"
                                        >
                                            <span className="text-muted-foreground text-sm">贏家獲得 </span>
                                            <span className="text-green-400 font-bold text-lg font-mono">
                                                +{previewResult.changes.find(c => c.delta > 0)?.delta || 0}
                                            </span>
                                        </motion.div>
                                    )}
                                    
                                    {fan >= maxFan && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold"
                                        >
                                            爆棚
                                        </motion.div>
                                    )}
                                    <MotionButton
                                        variant="primary"
                                        size="lg"
                                        onClick={() => goNext('confirm')}
                                        className="w-full mt-2"
                                    >
                                        下一步
                                    </MotionButton>
                                </motion.div>
                            )}

                            {/* Step 4b: Select Fans (Normal Mode) */}
                            {step === 'select-fans' && (
                                <motion.div
                                    key="select-fans"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex flex-col gap-4"
                                >
                                    <FanSelector
                                        selectedFanIds={selectedFanIds}
                                        onSelectionChange={handleFanSelectionChange}
                                    />
                                    
                                    {/* Preview section */}
                                    <div className="glass-card p-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-muted-foreground">總番數</div>
                                            <div className={cn(
                                                "text-xl font-bold",
                                                normalModeFan >= maxFan ? "text-primary" : "text-secondary"
                                            )}>
                                                {Math.min(normalModeFan, maxFan)}番
                                                {normalModeFan >= maxFan && <span className="text-xs ml-1">爆棚</span>}
                                            </div>
                                        </div>
                                        {previewResult && (
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">贏家獲得</div>
                                                <div className="text-green-400 font-bold text-lg font-mono">
                                                    +{previewResult.changes.find(c => c.delta > 0)?.delta || 0}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <MotionButton
                                        variant="primary"
                                        size="lg"
                                        onClick={() => goNext('confirm')}
                                        className="w-full"
                                        disabled={selectedFanIds.length === 0}
                                    >
                                        下一步
                                    </MotionButton>
                                </motion.div>
                            )}

                            {/* Step 5: Confirm */}
                            {step === 'confirm' && (
                                <motion.div
                                    key="confirm"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    {/* Winner & Fan Summary */}
                                    <div className="glass-card p-4 w-full">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-xs text-muted-foreground">贏家</div>
                                                <div className="text-lg font-bold">{winner?.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">
                                                    {isSelfDraw ? '自摸' : '出銃'}
                                                </div>
                                                <div className={cn(
                                                    "text-2xl font-bold",
                                                    (currentMode === 'pro' ? fan : normalModeFan) >= maxFan ? "text-primary" : "text-secondary"
                                                )}>
                                                    {Math.min(currentMode === 'pro' ? fan : normalModeFan, maxFan)}番
                                                    {(currentMode === 'pro' ? fan : normalModeFan) >= maxFan && <span className="text-sm ml-1">爆棚</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Show selected fans in normal mode */}
                                        {currentMode === 'normal' && selectedFanIds.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="text-xs text-muted-foreground mb-2">牌型</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedFanIds.map(id => {
                                                        const fanType = CANTONESE_FAN_TYPES.find(f => f.id === id);
                                                        return fanType ? (
                                                            <span key={id} className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                                                                {fanType.name}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Score Breakdown */}
                                    {previewResult && (
                                        <div className="glass-card p-4 w-full">
                                            <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                                                分數變化
                                            </div>
                                            <div className="space-y-2">
                                                {previewResult.changes.map((change) => {
                                                    const player = players.find(p => p.id === change.playerId);
                                                    const isWinner = change.delta > 0;
                                                    const isLoser = change.delta < 0;
                                                    return (
                                                        <motion.div
                                                            key={change.playerId}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isWinner && <TrendingUp size={14} className="text-green-400" />}
                                                                {isLoser && <TrendingDown size={14} className="text-red-400" />}
                                                                <span className={cn(
                                                                    "font-medium",
                                                                    isWinner && "text-green-400",
                                                                    isLoser && "text-red-400"
                                                                )}>
                                                                    {player?.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={cn(
                                                                    "font-mono font-bold",
                                                                    isWinner && "text-green-400",
                                                                    isLoser && "text-red-400"
                                                                )}>
                                                                    {change.delta > 0 ? '+' : ''}{change.delta}
                                                                </span>
                                                                <span className="text-muted-foreground text-sm font-mono">
                                                                    → {change.newScore}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <MotionButton
                                        variant="secondary"
                                        size="lg"
                                        onClick={handleConfirm}
                                        className="w-full mt-2 gap-2"
                                    >
                                        <Check size={20} />
                                        確認
                                    </MotionButton>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cancel Button */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <button
                            onClick={handleClose}
                            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
