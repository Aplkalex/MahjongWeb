"use client";

import React, { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { RadialSlider } from "@/uicapsule/radial-slider/radial-slider";
import { cn } from "@/lib/utils";

interface KnobControlProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

export function KnobControl({
    value,
    onChange,
    min = 0,
    max = 18,
    className,
}: KnobControlProps) {
    const [internalValue, setInternalValue] = useState(value - min);
    const range = max - min + 1;

    useEffect(() => {
        setInternalValue(value - min);
    }, [value, min]);

    const handleChange = (rawValue: number) => {
        const mappedValue = min + rawValue;
        const clamped = Math.max(min, Math.min(max, mappedValue));
        setInternalValue(rawValue);
        onChange(clamped);
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl bg-black p-4 shadow-2xl",
                className
            )}
            style={{ width: 280, height: 140 }}
        >
            {/* Bottom Gradient */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-[20%] bg-gradient-to-b from-transparent to-black" />

            {/* Value Display */}
            <div className="mb-4 flex items-center justify-center text-white">
                <NumberFlow value={min + internalValue} className="text-xl font-mono font-bold" />
                <span className="text-gray-400 ml-1 text-sm">番</span>
            </div>

            {/* Center Indicator Line */}
            <div className="pointer-events-none absolute left-1/2 z-20 h-full w-1 -translate-x-1/2 -translate-y-3 rounded-full bg-white" />

            {/* Radial Slider */}
            <RadialSlider
                value={internalValue}
                onChange={handleChange}
                maxValue={range}
            />
        </div>
    );
}
