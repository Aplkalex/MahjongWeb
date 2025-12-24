"use client";

import { useGameStore } from "@/stores/gameStore";
import { KnobControl } from "@/components/ui/KnobControl";
import { MotionButton } from "@/components/ui/MotionButton";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Settings, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
    { label: "二五雞", baseScore: 0.25 },
    { label: "五一", baseScore: 0.5 },
    { label: "一二蚊", baseScore: 1 },
];

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const settings = useGameStore(state => state.settings);
    const updateSettings = useGameStore(state => state.updateSettings);
    const resetGame = useGameStore(state => state.resetGame);

    const { scoringConfig } = settings;

    const handleMaxFanChange = (value: number) => {
        updateSettings({
            scoringConfig: {
                ...scoringConfig,
                maxFan: value
            }
        });
    };

    const handlePresetChange = (baseScore: number) => {
        updateSettings({
            scoringConfig: {
                ...scoringConfig,
                baseScore
            }
        });
    };

    const handlePaymentModeChange = (mode: 'half' | 'full') => {
        updateSettings({
            scoringConfig: {
                ...scoringConfig,
                paymentMode: mode
            }
        });
    };

    return (
        <>
            {/* Settings Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full glass-card flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
                <Settings size={24} />
            </motion.button>

            {/* Settings Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-0 bottom-0 w-full max-w-md glass-card rounded-l-2xl p-6 overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">設定</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Max Fan */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                    封頂番數
                                </h3>
                                <div className="flex justify-center">
                                    <KnobControl
                                        value={scoringConfig.maxFan}
                                        onChange={handleMaxFanChange}
                                        min={8}
                                        max={18}
                                        size={140}
                                    />
                                </div>
                            </div>

                            {/* Scoring Preset */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                    計分制度
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => handlePresetChange(preset.baseScore)}
                                            className={cn(
                                                "p-3 rounded-xl text-center font-medium transition-all",
                                                scoringConfig.baseScore === preset.baseScore
                                                    ? "bg-primary text-primary-foreground"
                                                    : "glass-card hover:ring-2 hover:ring-primary/50"
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Mode */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                    付款模式
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handlePaymentModeChange('full')}
                                        className={cn(
                                            "p-4 rounded-xl text-center transition-all",
                                            scoringConfig.paymentMode === 'full'
                                                ? "bg-primary text-primary-foreground"
                                                : "glass-card hover:ring-2 hover:ring-primary/50"
                                        )}
                                    >
                                        <div className="font-bold">全銃制</div>
                                        <div className="text-xs opacity-70">出銃包晒</div>
                                    </button>
                                    <button
                                        onClick={() => handlePaymentModeChange('half')}
                                        className={cn(
                                            "p-4 rounded-xl text-center transition-all",
                                            scoringConfig.paymentMode === 'half'
                                                ? "bg-primary text-primary-foreground"
                                                : "glass-card hover:ring-2 hover:ring-primary/50"
                                        )}
                                    >
                                        <div className="font-bold">半銃制</div>
                                        <div className="text-xs opacity-70">閒家都畀</div>
                                    </button>
                                </div>
                            </div>

                            {/* Reset Game */}
                            <div className="pt-6 border-t border-white/10">
                                <MotionButton
                                    variant="destructive"
                                    size="lg"
                                    onClick={() => {
                                        if (confirm("確定要重置遊戲嗎？所有記錄都會清除。")) {
                                            resetGame();
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="w-full gap-2"
                                >
                                    <RotateCcw size={18} />
                                    重置遊戲
                                </MotionButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
