"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Wind, WIND_NAMES } from "@/lib/engine/types";

interface WindProgressProps {
    currentWind: Wind;
    roundNumber: number;
    dealerSeatIndex: number;
    className?: string;
}

const WINDS: Wind[] = ['east', 'south', 'west', 'north'];

const WIND_COLORS: Record<Wind, string> = {
    east: 'hsl(354, 70%, 54%)',
    south: 'hsl(217, 91%, 60%)',
    west: 'hsl(168, 70%, 42%)',
    north: 'hsl(43, 96%, 56%)',
};

export function WindProgress({ 
    currentWind, 
    roundNumber, 
    dealerSeatIndex,
    className 
}: WindProgressProps) {
    const currentWindIndex = WINDS.indexOf(currentWind);
    
    // Calculate which sub-round we're in (1-4 within each wind)
    // dealerSeatIndex cycles 0,1,2,3,0,1,2,3...
    const subRound = dealerSeatIndex + 1;

    return (
        <div className={cn("glass-card p-4", className)}>
            {/* Wind Circle Progress */}
            <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                    {/* Background circle */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted/30"
                        />
                        {/* Progress arc for completed winds */}
                        {WINDS.map((wind, i) => {
                            const isCompleted = i < currentWindIndex;
                            const isCurrent = i === currentWindIndex;
                            const startAngle = (i * 90);
                            const progress = isCurrent ? (subRound / 4) : (isCompleted ? 1 : 0);
                            const endAngle = startAngle + (90 * progress);
                            
                            if (progress === 0) return null;
                            
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            const x1 = 50 + 42 * Math.cos(startRad);
                            const y1 = 50 + 42 * Math.sin(startRad);
                            const x2 = 50 + 42 * Math.cos(endRad);
                            const y2 = 50 + 42 * Math.sin(endRad);
                            const largeArc = progress > 0.5 ? 1 : 0;
                            
                            return (
                                <motion.path
                                    key={wind}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    d={`M ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2}`}
                                    fill="none"
                                    stroke={WIND_COLORS[wind]}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            key={currentWind}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-3xl font-bold"
                            style={{ color: WIND_COLORS[currentWind] }}
                        >
                            {WIND_NAMES[currentWind]}
                        </motion.div>
                        <div className="text-sm text-muted-foreground">
                            第 {subRound} 局
                        </div>
                    </div>
                </div>
            </div>

            {/* Wind Labels */}
            <div className="flex justify-center gap-2">
                {WINDS.map((wind, i) => {
                    const isCompleted = i < currentWindIndex;
                    const isCurrent = i === currentWindIndex;
                    
                    return (
                        <motion.div
                            key={wind}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                isCurrent && "ring-2 ring-offset-2 ring-offset-background",
                                isCompleted && "opacity-50"
                            )}
                            style={{
                                backgroundColor: isCurrent 
                                    ? `${WIND_COLORS[wind]}20` 
                                    : 'rgba(255,255,255,0.05)',
                                color: isCurrent || isCompleted 
                                    ? WIND_COLORS[wind] 
                                    : 'var(--muted-foreground)',
                                // @ts-expect-error CSS custom property for ring color
                                '--tw-ring-color': isCurrent ? WIND_COLORS[wind] : 'transparent',
                            }}
                        >
                            {WIND_NAMES[wind]}風
                            {isCompleted && ' ✓'}
                        </motion.div>
                    );
                })}
            </div>

            {/* Round Info */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
                總局數：第 <span className="font-mono font-bold text-foreground">{roundNumber}</span> 局
            </div>
        </div>
    );
}
