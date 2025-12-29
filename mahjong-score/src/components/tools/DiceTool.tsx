"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionButton } from "@/components/ui/MotionButton";
import { X, Dices, RotateCcw } from "lucide-react";

interface DiceToolProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animation constants
const DICE_ANIMATION_DURATION = 1.2;
const JELLY_EASING = [0.34, 1.56, 0.64, 1] as const;

function Dice({ value, rolling }: { value: number; rolling: boolean }) {
    const dots = getDotPositions(value);
    
    return (
        <motion.div
            animate={rolling ? {
                rotateX: [0, 180, 360, 540, 720, 900, 1080, 1260],
                rotateY: [0, 90, 270, 450, 630, 720, 810, 900],
                rotateZ: [0, 45, -30, 60, -45, 30, -15, 0],
                scaleX: [1, 0.95, 1.05, 0.92, 1.08, 0.98, 1.03, 1],
                scaleY: [1, 1.08, 0.95, 1.12, 0.92, 1.05, 0.98, 1],
            } : {
                scaleX: 1,
                scaleY: 1,
            }}
            transition={rolling ? {
                duration: DICE_ANIMATION_DURATION,
                ease: JELLY_EASING,
                times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
            } : {
                type: "spring",
                stiffness: 400,
                damping: 15,
                mass: 0.8,
            }}
            className={cn(
                "w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-200 shadow-xl",
                "flex items-center justify-center relative",
                "border-2 border-gray-300"
            )}
            style={{
                transformStyle: "preserve-3d",
            }}
        >
            <div className="grid grid-cols-3 grid-rows-3 gap-1 p-2 w-full h-full">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                    <div
                        key={pos}
                        className="flex items-center justify-center"
                    >
                        {dots.includes(pos) && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                    delay: rolling ? DICE_ANIMATION_DURATION : 0, 
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 10,
                                    mass: 0.5,
                                }}
                                className="w-3.5 h-3.5 rounded-full bg-gray-800 shadow-inner"
                            />
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function getDotPositions(value: number): number[] {
    // Grid positions: 0 1 2 / 3 4 5 / 6 7 8
    switch (value) {
        case 1: return [4];
        case 2: return [0, 8];
        case 3: return [0, 4, 8];
        case 4: return [0, 2, 6, 8];
        case 5: return [0, 2, 4, 6, 8];
        case 6: return [0, 2, 3, 5, 6, 8];
        default: return [];
    }
}

export function DiceTool({ isOpen, onClose }: DiceToolProps) {
    const [dice1, setDice1] = useState(1);
    const [dice2, setDice2] = useState(1);
    const [dice3, setDice3] = useState(1);
    const [rolling, setRolling] = useState(false);
    const [history, setHistory] = useState<number[]>([]);

    const rollDice = useCallback(() => {
        if (rolling) return;
        
        setRolling(true);
        
        // Simulate rolling animation
        const rollInterval = setInterval(() => {
            setDice1(Math.floor(Math.random() * 6) + 1);
            setDice2(Math.floor(Math.random() * 6) + 1);
            setDice3(Math.floor(Math.random() * 6) + 1);
        }, 100);

        setTimeout(() => {
            clearInterval(rollInterval);
            const final1 = Math.floor(Math.random() * 6) + 1;
            const final2 = Math.floor(Math.random() * 6) + 1;
            const final3 = Math.floor(Math.random() * 6) + 1;
            setDice1(final1);
            setDice2(final2);
            setDice3(final3);
            setRolling(false);
            setHistory(prev => [final1 + final2 + final3, ...prev.slice(0, 9)]);
        }, DICE_ANIMATION_DURATION * 1000);
    }, [rolling]);

    const total = dice1 + dice2 + dice3;

    // Determine starting position (傳統麻雀由莊家位逆時針數)
    const getStartPosition = (total: number): string => {
        const positions = ['東', '南', '西', '北'];
        // 麻雀骰子規則：由莊家位開始逆時針數
        const posIndex = (total - 1) % 4;
        return positions[posIndex];
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card w-full max-w-sm p-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Dices size={24} className="text-primary" />
                                擲骰仔
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Dice Display */}
                        <div className="flex justify-center gap-4 mb-6">
                            <Dice value={dice1} rolling={rolling} />
                            <Dice value={dice2} rolling={rolling} />
                            <Dice value={dice3} rolling={rolling} />
                        </div>

                        {/* Total */}
                        <motion.div
                            key={total}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-center mb-6"
                        >
                            <div className="text-5xl font-bold text-primary mb-2">
                                {total}
                            </div>
                            <div className="text-muted-foreground">
                                {!rolling && (
                                    <span>
                                        由 <span className="text-foreground font-bold">{getStartPosition(total)}</span> 位開始
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Roll Button */}
                        <MotionButton
                            variant="primary"
                            size="lg"
                            onClick={rollDice}
                            disabled={rolling}
                            className="w-full gap-2 mb-4"
                        >
                            {rolling ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                                >
                                    <Dices size={20} />
                                </motion.div>
                            ) : (
                                <Dices size={20} />
                            )}
                            {rolling ? '擲緊...' : '擲骰仔'}
                        </MotionButton>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                        歷史記錄
                                    </span>
                                    <button
                                        onClick={() => setHistory([])}
                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <RotateCcw size={12} />
                                        清除
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {history.map((h, i) => (
                                        <motion.div
                                            key={`${h}-${i}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm",
                                                i === 0 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "glass-card text-muted-foreground"
                                            )}
                                        >
                                            {h}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
