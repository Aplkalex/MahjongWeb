"use client";

import { MotionButton } from "@/components/ui/MotionButton";
import { MinusCircle, Trophy, Undo2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CenterInfoProps {
    roundWind: 'east' | 'south' | 'west' | 'north';
    roundNumber: number;
    dealerCount: number;
    onWin: () => void;
    onDraw: () => void;
    onUndo?: () => void;
    onHistory?: () => void;
    canUndo?: boolean;
}

const WIND_LABELS: Record<string, string> = {
    east: "東",
    south: "南",
    west: "西",
    north: "北"
};

export function CenterInfo({ 
    roundWind, 
    roundNumber, 
    dealerCount, 
    onWin, 
    onDraw,
    onUndo,
    onHistory,
    canUndo = false,
}: CenterInfoProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
        >
            {/* Compact Round Display */}
            <div className="glass-card px-6 py-3 text-center">
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">
                        {WIND_LABELS[roundWind]}
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                        {roundNumber}
                    </span>
                    <span className="text-lg text-muted-foreground">局</span>
                </div>
                <AnimatePresence>
                    {dealerCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1 text-sm font-medium text-[hsl(43,96%,56%)]"
                        >
                            連莊 {dealerCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-3">
                <MotionButton
                    variant="secondary"
                    onClick={onDraw}
                    size="md"
                    className="gap-2"
                >
                    <MinusCircle size={18} />
                    流局
                </MotionButton>
                <MotionButton
                    variant="primary"
                    onClick={onWin}
                    size="lg"
                    className="gap-2 px-8 font-bold"
                >
                    <Trophy size={20} />
                    食糊
                </MotionButton>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2">
                <AnimatePresence>
                    {canUndo && onUndo && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <MotionButton
                                variant="ghost"
                                size="sm"
                                onClick={onUndo}
                                className="gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <Undo2 size={16} />
                                撤銷
                            </MotionButton>
                        </motion.div>
                    )}
                </AnimatePresence>
                {onHistory && (
                    <MotionButton
                        variant="ghost"
                        size="sm"
                        onClick={onHistory}
                        className="gap-1 text-muted-foreground hover:text-foreground"
                    >
                        <History size={16} />
                        記錄
                    </MotionButton>
                )}
            </div>
        </motion.div>
    );
}
