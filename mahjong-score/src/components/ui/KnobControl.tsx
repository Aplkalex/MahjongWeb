"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RadialSlider } from "@/components/ui/RadialSlider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface KnobControlProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
    size?: number;
}

export function KnobControl({
    value,
    onChange,
    min = 0,
    max = 18,
    className,
    size = 280,
}: KnobControlProps) {
    const [internalValue, setInternalValue] = useState(value - min);
    const [isDragging, setIsDragging] = useState(false);
    const range = max - min + 1;
    const isAtMax = value >= max;
    const isAtMin = value <= min;

    useEffect(() => {
        setInternalValue(value - min);
    }, [value, min]);

    const handleChange = useCallback((rawValue: number) => {
        const mappedValue = min + rawValue;
        const clamped = Math.max(min, Math.min(max, mappedValue));
        setInternalValue(rawValue);
        onChange(clamped);
    }, [min, max, onChange]);

    const handleIncrement = useCallback(() => {
        if (value < max) {
            onChange(value + 1);
        }
    }, [value, max, onChange]);

    const handleDecrement = useCallback(() => {
        if (value > min) {
            onChange(value - 1);
        }
    }, [value, min, onChange]);

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-black shadow-2xl",
                "border border-white/10",
                isAtMax && "ring-2 ring-primary ring-offset-2 ring-offset-black",
                className
            )}
            style={{ width: size, height: size * 0.6 }}
        >
            {/* Ambient glow when at max */}
            <AnimatePresence>
                {isAtMax && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-primary/10 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Bottom Gradient */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-[25%] bg-gradient-to-b from-transparent to-black" />

            {/* Value Display with +/- buttons */}
            <div className="relative z-40 flex items-center justify-center gap-4 pt-4 pb-2">
                {/* Decrement Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecrement}
                    disabled={isAtMin}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        "bg-white/10 hover:bg-white/20",
                        isAtMin && "opacity-30 cursor-not-allowed"
                    )}
                >
                    <Minus size={18} className="text-white" />
                </motion.button>

                {/* Value */}
                <div className="flex items-baseline">
                    <NumberFlow 
                        value={value} 
                        className={cn(
                            "text-4xl font-mono font-bold transition-colors",
                            isAtMax ? "text-primary" : "text-white"
                        )} 
                    />
                    <span className="text-gray-400 ml-1 text-lg">番</span>
                </div>

                {/* Increment Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleIncrement}
                    disabled={isAtMax}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        "bg-white/10 hover:bg-white/20",
                        isAtMax && "opacity-30 cursor-not-allowed"
                    )}
                >
                    <Plus size={18} className="text-white" />
                </motion.button>
            </div>

            {/* Center Indicator Line */}
            <div className="pointer-events-none absolute left-1/2 top-[55%] z-20 h-[45%] w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />

            {/* Radial Slider */}
            <div className="relative" style={{ marginTop: -10 }}>
                <RadialSlider
                    value={internalValue}
                    onChange={handleChange}
                    maxValue={range}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                />
            </div>

            {/* Drag hint */}
            <AnimatePresence>
                {!isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 pointer-events-none z-40"
                    >
                        ← 撥動調整 →
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
