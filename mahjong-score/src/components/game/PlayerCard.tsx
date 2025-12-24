"use client";

import { Player } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { useEffect, useState } from "react";

interface PlayerCardProps {
    player: Player;
    wind: 'east' | 'south' | 'west' | 'north';
    isDealer?: boolean;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}

const WIND_LABELS: Record<string, string> = {
    east: "東",
    south: "南",
    west: "西",
    north: "北"
};

function AnimatedScore({ value }: { value: number }) {
    const spring = useSpring(value, { stiffness: 100, damping: 30 });
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        spring.set(value);
        return spring.on("change", (v) => setDisplay(Math.round(v)));
    }, [value, spring]);

    return <span>{display}</span>;
}

export function PlayerCard({
    player,
    wind,
    isDealer,
    isActive,
    onClick,
    className
}: PlayerCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "glass-card relative p-5 cursor-pointer select-none",
                "transition-shadow duration-300",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isDealer && "shadow-[0_0_20px_rgba(244,162,97,0.3)]",
                className
            )}
        >
            {/* Dealer Indicator - Gold border glow */}
            {isDealer && (
                <div className="absolute inset-0 rounded-[1rem] border-2 border-[hsl(43,96%,56%)] opacity-60" />
            )}

            {/* Wind Badge */}
            <div className={cn("wind-badge absolute top-3 left-3", `wind-${wind}`)}>
                {WIND_LABELS[wind]}
            </div>

            {/* Content */}
            <div className="flex flex-col items-center pt-6 gap-2">
                {/* Name */}
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">
                    {player.name}
                </span>

                {/* Score */}
                <div className="score-text tabular-nums">
                    <AnimatedScore value={player.score} />
                </div>

                {/* Dealer Label */}
                {isDealer && (
                    <span className="text-xs font-bold text-[hsl(43,96%,56%)] uppercase tracking-wider">
                        莊家
                    </span>
                )}
            </div>
        </motion.div>
    );
}
