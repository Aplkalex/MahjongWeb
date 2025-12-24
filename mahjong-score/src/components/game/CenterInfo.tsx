"use client";

import { MotionButton } from "@/components/ui/MotionButton";
import { MinusCircle, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface CenterInfoProps {
    roundWind: 'east' | 'south' | 'west' | 'north';
    roundNumber: number;
    dealerCount: number;
    onWin: () => void;
    onDraw: () => void;
}

const WIND_LABELS: Record<string, string> = {
    east: "東",
    south: "南",
    west: "西",
    north: "北"
};

export function CenterInfo({ roundWind, roundNumber, dealerCount, onWin, onDraw }: CenterInfoProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            className="flex flex-col items-center gap-5"
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
                {dealerCount > 0 && (
                    <div className="mt-1 text-sm font-medium text-[hsl(43,96%,56%)]">
                        連莊 {dealerCount}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
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
        </motion.div>
    );
}
