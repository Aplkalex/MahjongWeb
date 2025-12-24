"use client";

import { useGameStore } from "@/stores/gameStore";
import { KnobControl } from "@/components/ui/KnobControl";
import { MotionButton } from "@/components/ui/MotionButton";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Player } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Hand, Users, Zap } from "lucide-react";
import { calculateCantoneseScore } from "@/lib/engine/cantonese";

type WinStep = 'select-winner' | 'win-type' | 'select-discarder' | 'input-fan' | 'confirm';

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

    const [step, setStep] = useState<WinStep>('select-winner');
    const [direction, setDirection] = useState(0);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [isSelfDraw, setIsSelfDraw] = useState(true);
    const [discarderId, setDiscarderId] = useState<string | null>(null);
    const [fan, setFan] = useState(3);

    // Track if this is a real click vs a drag release (must be before early return)
    const [isPointerDown, setIsPointerDown] = useState(false);
    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

    if (!winFlow || !game) return null;

    const { players, dealerSeatIndex } = game;
    const maxFan = settings.scoringConfig.maxFan;

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
            goNext('input-fan');
        } else {
            goNext('select-discarder');
        }
    };

    const handleSelectDiscarder = (playerId: string) => {
        setDiscarderId(playerId);
        goNext('input-fan');
    };

    const handleConfirm = () => {
        const winnerIdx = players.findIndex(p => p.id === winnerId);
        const effectiveFan = Math.min(fan, maxFan);
        const dealerId = players[dealerSeatIndex].id;

        // Calculate score using the engine
        const result = calculateCantoneseScore({
            mode: 'pro',
            winType: isSelfDraw ? 'self-draw' : 'discard',
            winnerId: winnerId!,
            loserId: isSelfDraw ? undefined : discarderId!,
            fanCount: effectiveFan,
            players,
            dealerId,
        }, settings.scoringConfig);

        // Record the win with the calculated result
        const description = `${players[winnerIdx].name} ${isSelfDraw ? '自摸' : '出銃'} ${effectiveFan}番`;
        recordWin(result, description);

        // Reset and close
        setStep('select-winner');
        setWinnerId(null);
        setDiscarderId(null);
        setFan(3);
        cancelWinFlow();
    };

    const handleClose = () => {
        setStep('select-winner');
        setWinnerId(null);
        setDiscarderId(null);
        setFan(3);
        cancelWinFlow();
    };

    const getWind = (idx: number) => {
        const windIdx = (idx - dealerSeatIndex + 4) % 4;
        const winds: ('east' | 'south' | 'west' | 'north')[] = ['east', 'south', 'west', 'north'];
        return winds[windIdx];
    };

    const winner = players.find(p => p.id === winnerId);

    const handleBackdropPointerDown = (e: React.PointerEvent) => {
        setIsPointerDown(true);
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleBackdropPointerUp = (e: React.PointerEvent) => {
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
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        {step !== 'select-winner' && (
                            <button
                                onClick={() => {
                                    if (step === 'win-type') goBack('select-winner');
                                    else if (step === 'select-discarder') goBack('win-type');
                                    else if (step === 'input-fan') goBack(isSelfDraw ? 'win-type' : 'select-discarder');
                                    else if (step === 'confirm') goBack('input-fan');
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
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="glass-card p-5 w-full text-center">
                                        <div className="text-sm text-muted-foreground mb-1">贏家</div>
                                        <div className="text-xl font-bold">{winner?.name}</div>
                                    </div>
                                    <div className="glass-card p-5 w-full text-center">
                                        <div className="text-sm text-muted-foreground mb-1">
                                            {isSelfDraw ? '自摸' : '出銃'}
                                        </div>
                                        <div className="text-3xl font-bold text-primary">
                                            {Math.min(fan, maxFan)} 番
                                        </div>
                                    </div>
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
