"use client";

import React, { useRef, useCallback, useEffect } from "react";
import {
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useTransform,
} from "motion/react";

interface RadialSliderProps {
    value: number;
    onChange: (value: number) => void;
    maxValue?: number;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

export const RadialSlider = ({
    value,
    onChange,
    maxValue = 19,
    onDragStart,
    onDragEnd,
}: RadialSliderProps) => {
    const motionX = useMotionValue(0);
    const rotate = useMotionValue(0);
    const accumulatedRotation = useRef(0);
    const isDragging = useRef(false);

    // More ticks for smoother look
    const tickCount = maxValue * 3;

    // Sync rotation with external value changes
    useEffect(() => {
        if (!isDragging.current) {
            const snapAngle = 360 / maxValue;
            const targetRotation = -value * snapAngle;
            accumulatedRotation.current = targetRotation;
            animate(rotate, targetRotation, {
                type: "spring",
                stiffness: 300,
                damping: 30,
            });
        }
    }, [value, maxValue, rotate]);

    const getValueFromRotation = useCallback((rotation: number) => {
        const snapAngle = 360 / maxValue;
        // Negative rotation = positive value (drag right = increase)
        let normalized = ((-rotation % 360) + 360) % 360;
        const snapped = Math.round(normalized / snapAngle) * snapAngle;
        const index = Math.round(snapped / snapAngle) % maxValue;
        return Math.max(0, Math.min(maxValue - 1, index));
    }, [maxValue]);

    useMotionValueEvent(motionX, "change", (latest) => {
        rotate.set(accumulatedRotation.current - latest / 2.5);
    });

    // Calculate tick visibility based on rotation for 3D effect
    const getTickOpacity = (tickIndex: number, totalTicks: number) => {
        const tickAngle = tickIndex * (360 / totalTicks);
        // Top portion (330-30 degrees) should be more visible
        const normalized = ((tickAngle % 360) + 360) % 360;
        if (normalized > 300 || normalized < 60) {
            return 1;
        } else if (normalized > 240 || normalized < 120) {
            return 0.5;
        }
        return 0.2;
    };

    return (
        <>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                onDragStart={() => {
                    isDragging.current = true;
                    onDragStart?.();
                }}
                onDrag={(event, info) => {
                    motionX.set(info.offset.x);
                    const currentRotation = rotate.get();
                    const newValue = getValueFromRotation(currentRotation);
                    onChange(newValue);
                }}
                onDragEnd={() => {
                    const currentRotation = rotate.get();
                    const snapAngle = 360 / maxValue;

                    // Snap to nearest value
                    const rawValue = getValueFromRotation(currentRotation);
                    const finalRotation = -rawValue * snapAngle;

                    accumulatedRotation.current = finalRotation;

                    animate(rotate, finalRotation, {
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                    });

                    onChange(rawValue);
                    
                    setTimeout(() => {
                        isDragging.current = false;
                        onDragEnd?.();
                    }, 100);
                }}
                style={{ rotate }}
                className="relative aspect-square w-full cursor-grab rounded-full bg-transparent active:cursor-grabbing"
            >
                {/* Tick marks with visual hierarchy */}
                {Array.from({ length: tickCount }).map((_, i) => {
                    const tickAngle = i * (360 / tickCount);
                    const isValueTick = i % 3 === 0; // Every 3rd tick is a value tick
                    const valueIndex = Math.floor(i / 3);
                    const opacity = getTickOpacity(i, tickCount);

                    return (
                        <div
                            key={i}
                            className="absolute inset-0 flex justify-center overflow-hidden rounded-full"
                            style={{
                                transform: `rotate(${tickAngle}deg)`,
                                opacity,
                            }}
                        >
                            {isValueTick ? (
                                // Value tick - larger with glow
                                <div className="absolute top-0 flex flex-col items-center">
                                    <div className="h-3 w-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                                </div>
                            ) : (
                                // Minor tick
                                <div className="absolute top-1 h-2 w-px bg-gray-500" />
                            )}
                        </div>
                    );
                })}

                {/* Center decorative ring */}
                <div className="absolute inset-8 rounded-full border border-white/10" />
                <div className="absolute inset-16 rounded-full border border-white/5" />
            </motion.div>
            
            {/* Bottom fade gradient */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[calc(50%+1rem)] bg-gradient-to-t from-black to-transparent" />
        </>
    );
};
