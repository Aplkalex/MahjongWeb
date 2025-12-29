"use client";

import { useGameStore } from "@/stores/gameStore";
import { KnobControl } from "@/components/ui/KnobControl";
import { MotionButton } from "@/components/ui/MotionButton";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Settings, X, RotateCcw, Edit2, Check, Gauge, List } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
    { label: "二五雞", baseScore: 0.25 },
    { label: "五一", baseScore: 0.5 },
    { label: "一二蚊", baseScore: 1 },
];

const WIND_LABELS = ["東", "南", "西", "北"];

function PlayerNameEditor({ 
    index, 
    name, 
    onChange 
}: { 
    index: number; 
    name: string; 
    onChange: (name: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (tempName.trim()) {
            onChange(tempName.trim());
        } else {
            setTempName(name);
        }
        setIsEditing(false);
    };

    return (
        <div className="glass-card p-3 flex items-center gap-3">
            <div className={cn("wind-badge", `wind-${['east', 'south', 'west', 'north'][index]}`)}>
                {WIND_LABELS[index]}
            </div>
            {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') {
                                setTempName(name);
                                setIsEditing(false);
                            }
                        }}
                        onBlur={handleSave}
                        className="flex-1 bg-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                        maxLength={10}
                    />
                    <button
                        onClick={handleSave}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-primary"
                    >
                        <Check size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium">{name}</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const settings = useGameStore(state => state.settings);
    const updateSettings = useGameStore(state => state.updateSettings);
    const updatePlayerName = useGameStore(state => state.updatePlayerName);
    const resetGame = useGameStore(state => state.resetGame);
    const preferredInputMode = useGameStore(state => state.preferredInputMode);
    const setPreferredInputMode = useGameStore(state => state.setPreferredInputMode);

    const { scoringConfig, playerNames } = settings;

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

    const handlePlayerNameChange = (index: number, name: string) => {
        updatePlayerName(index as 0 | 1 | 2 | 3, name);
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

                            {/* Player Names */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                    玩家名稱
                                </h3>
                                <div className="space-y-2">
                                    {playerNames.map((name, index) => (
                                        <PlayerNameEditor
                                            key={index}
                                            index={index}
                                            name={name}
                                            onChange={(newName) => handlePlayerNameChange(index, newName)}
                                        />
                                    ))}
                                </div>
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
                                        size={220}
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

                            {/* Input Mode */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                    計番模式
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPreferredInputMode('pro')}
                                        className={cn(
                                            "p-4 rounded-xl text-center transition-all",
                                            preferredInputMode === 'pro'
                                                ? "bg-secondary text-secondary-foreground"
                                                : "glass-card hover:ring-2 hover:ring-secondary/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Gauge size={18} />
                                            <span className="font-bold">入分模式</span>
                                        </div>
                                        <div className="text-xs opacity-70">直接輸入番數</div>
                                    </button>
                                    <button
                                        onClick={() => setPreferredInputMode('normal')}
                                        className={cn(
                                            "p-4 rounded-xl text-center transition-all",
                                            preferredInputMode === 'normal'
                                                ? "bg-secondary text-secondary-foreground"
                                                : "glass-card hover:ring-2 hover:ring-secondary/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <List size={18} />
                                            <span className="font-bold">計番模式</span>
                                        </div>
                                        <div className="text-xs opacity-70">揀牌型計番</div>
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
