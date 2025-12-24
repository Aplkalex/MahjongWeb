"use client";

import React, { useRef, useCallback } from "react";
import {
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from "motion/react";

interface RadialSliderProps {
    value: number;
    onChange: (value: number) => void;
    maxValue?: number;
}

export const RadialSlider = ({
    value,
    onChange,
    maxValue = 19,
}: RadialSliderProps) => {
    const motionX = useMotionValue(0);
    const rotate = useMotionValue(0);
    const accumulatedRotation = useRef(0);

    // Fewer ticks for cleaner look
    const tickCount = 60;

    const getValueFromRotation = useCallback((rotation: number) => {
        const snapAngle = 360 / maxValue;
        let normalized = ((rotation % 360) + 360) % 360;
        const snapped = Math.round(normalized / snapAngle) * snapAngle;
        const index = Math.round(snapped / snapAngle) % maxValue;
        // Clamp to valid range
        return Math.max(0, Math.min(maxValue - 1, index));
    }, [maxValue]);

    useMotionValueEvent(motionX, "change", (latest) => {
        rotate.set(accumulatedRotation.current - latest / 3);
    });

    return (
        <>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                onDrag={(event, info) => {
                    motionX.set(info.offset.x);
                    const currentRotation = rotate.get();
                    const newValue = getValueFromRotation(currentRotation);
                    onChange(newValue);
                }}
                onDragEnd={() => {
                    const currentRotation = rotate.get();
                    const snapAngle = 360 / maxValue;

                    let normalized = ((currentRotation % 360) + 360) % 360;
                    const nearestMultiple = Math.round(normalized / snapAngle) * snapAngle;
                    const fullRotations = Math.floor(currentRotation / 360) * 360;
                    const finalRotation = fullRotations + nearestMultiple;

                    accumulatedRotation.current = finalRotation;

                    animate(rotate, finalRotation, {
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                    });

                    // Ensure final value is clamped
                    const finalValue = getValueFromRotation(finalRotation);
                    onChange(finalValue);
                }}
                style={{ rotate }}
                className="relative aspect-square w-full cursor-grab rounded-full bg-transparent active:cursor-grabbing"
            >
                {/* Small tick marks */}
                {Array.from({ length: tickCount }).map((_, i) => {
                    // Check if this tick aligns with a value position
                    const tickAngle = i * (360 / tickCount);
                    const valueAngle = (360 / maxValue);
                    const isValueTick = Math.abs(tickAngle % valueAngle) < 0.5 || Math.abs(tickAngle % valueAngle - valueAngle) < 0.5;

                    return (
                        <div
                            key={i}
                            className="absolute inset-0 flex justify-center overflow-hidden rounded-full"
                            style={{
                                transform: `rotate(${tickAngle}deg)`,
                            }}
                        >
                            {isValueTick ? (
                                // Dot for actual values
                                <div className="absolute top-0 h-2 w-2 rounded-full bg-white" />
                            ) : (
                                // Small line for decoration
                                <div className="absolute top-0 h-3 w-px bg-gray-600" />
                            )}
                        </div>
                    );
                })}
            </motion.div>
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[calc(50%+1rem)] bg-gradient-to-t from-black to-transparent" />
        </>
    );
};
