"use client";

import { Player, SeatIndex } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { Edit2, Check } from "lucide-react";

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
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            setFlash(value > prevValue.current ? 'up' : 'down');
            setTimeout(() => setFlash(null), 800);
            prevValue.current = value;
        }
        spring.set(value);
        return spring.on("change", (v) => setDisplay(Math.round(v)));
    }, [value, spring]);

    return (
        <span className={cn(
            "transition-colors duration-300",
            flash === 'up' && "text-green-400",
            flash === 'down' && "text-red-400"
        )}>
            {display}
        </span>
    );
}

function EditableName({ 
    player, 
    seatIndex 
}: { 
    player: Player; 
    seatIndex: SeatIndex;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(player.name);
    const updatePlayerName = useGameStore(state => state.updatePlayerName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (tempName.trim() && tempName !== player.name) {
            updatePlayerName(seatIndex, tempName.trim());
        } else {
            setTempName(player.name);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setTempName(player.name);
                            setIsEditing(false);
                        }
                    }}
                    onBlur={handleSave}
                    className="w-20 bg-white/10 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary text-center"
                    maxLength={10}
                />
                <button onClick={handleSave} className="p-1 hover:bg-white/10 rounded">
                    <Check size={12} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className="group flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
            <span className="truncate max-w-[100px]">{player.name}</span>
            <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
    );
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
                {/* Name (Editable) */}
                <EditableName player={player} seatIndex={player.seatIndex} />

                {/* Score */}
                <div className="score-text tabular-nums">
                    <AnimatedScore value={player.score} />
                </div>

                {/* Dealer Label */}
                <AnimatePresence>
                    {isDealer && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-xs font-bold text-[hsl(43,96%,56%)] uppercase tracking-wider"
                        >
                            莊家
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
