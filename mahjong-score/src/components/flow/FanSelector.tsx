"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FanType, FanCategory } from "@/lib/engine/types";
import { CANTONESE_FAN_TYPES } from "@/lib/engine/cantonese";
import { Check, X, Search, Info } from "lucide-react";
import NumberFlow from "@number-flow/react";

interface FanSelectorProps {
    selectedFanIds: string[];
    onSelectionChange: (fanIds: string[]) => void;
    className?: string;
}

const CATEGORY_NAMES: Record<FanCategory, string> = {
    basic: '基本',
    triplets: '刻子',
    suits: '花色',
    honors: '字牌',
    terminals: '么九',
    special: '特殊',
    situational: '情景',
    flowers: '花牌',
    limit: '例牌',
};

const CATEGORY_ORDER: FanCategory[] = [
    'situational',
    'basic',
    'triplets',
    'suits',
    'honors',
    'terminals',
    'flowers',
    'special',
    'limit',
];

// Group fans by value for quick selection
const FAN_VALUE_GROUPS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 13];

export function FanSelector({ 
    selectedFanIds, 
    onSelectionChange, 
    className 
}: FanSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<FanCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInfo, setShowInfo] = useState<string | null>(null);

    // Filter and group fans
    const filteredFans = useMemo(() => {
        let fans = CANTONESE_FAN_TYPES;
        
        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            fans = fans.filter(f => 
                f.name.includes(query) || 
                f.nameEn.toLowerCase().includes(query) ||
                f.description.includes(query)
            );
        }
        
        // Filter by category
        if (activeCategory !== 'all') {
            fans = fans.filter(f => f.category === activeCategory);
        }
        
        return fans;
    }, [searchQuery, activeCategory]);

    // Group by category
    const fansByCategory = useMemo(() => {
        const grouped: Record<FanCategory, FanType[]> = {} as Record<FanCategory, FanType[]>;
        filteredFans.forEach(fan => {
            if (!grouped[fan.category]) {
                grouped[fan.category] = [];
            }
            grouped[fan.category].push(fan);
        });
        return grouped;
    }, [filteredFans]);

    // Calculate total fan
    const totalFan = useMemo(() => {
        return selectedFanIds.reduce((total, id) => {
            const fan = CANTONESE_FAN_TYPES.find(f => f.id === id);
            return total + (fan?.value || 0);
        }, 0);
    }, [selectedFanIds]);

    const toggleFan = (fanId: string) => {
        const fan = CANTONESE_FAN_TYPES.find(f => f.id === fanId);
        if (!fan) return;

        if (selectedFanIds.includes(fanId)) {
            // Remove
            onSelectionChange(selectedFanIds.filter(id => id !== fanId));
        } else {
            // Add (check incompatible)
            let newSelection = [...selectedFanIds];
            
            // Remove incompatible fans
            if (fan.incompatibleWith) {
                newSelection = newSelection.filter(id => !fan.incompatibleWith?.includes(id));
            }
            
            newSelection.push(fanId);
            onSelectionChange(newSelection);
        }
    };

    const clearSelection = () => {
        onSelectionChange([]);
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Total Fan Display */}
            <div className="glass-card p-4 mb-4 flex items-center justify-between">
                <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        總番數
                    </div>
                    <div className="text-3xl font-bold text-primary flex items-baseline gap-1">
                        <NumberFlow value={totalFan} />
                        <span className="text-lg text-muted-foreground">番</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        已選 {selectedFanIds.length} 項
                    </div>
                    {selectedFanIds.length > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearSelection}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="搜尋番種..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl glass-card outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                        activeCategory === 'all'
                            ? "bg-primary text-primary-foreground"
                            : "glass-card hover:bg-white/10"
                    )}
                >
                    全部
                </button>
                {CATEGORY_ORDER.map(cat => {
                    const count = CANTONESE_FAN_TYPES.filter(f => f.category === cat).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                activeCategory === cat
                                    ? "bg-primary text-primary-foreground"
                                    : "glass-card hover:bg-white/10"
                            )}
                        >
                            {CATEGORY_NAMES[cat]}
                        </button>
                    );
                })}
            </div>

            {/* Selected Fans Summary */}
            {selectedFanIds.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">已選番種：</div>
                    <div className="flex flex-wrap gap-1">
                        {selectedFanIds.map(id => {
                            const fan = CANTONESE_FAN_TYPES.find(f => f.id === id);
                            if (!fan) return null;
                            return (
                                <motion.button
                                    key={id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    onClick={() => toggleFan(id)}
                                    className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1 hover:bg-primary/30"
                                >
                                    {fan.name}
                                    <span className="opacity-70">({fan.value}番)</span>
                                    <X size={12} />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Fan List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeCategory === 'all' ? (
                    // Show by category
                    CATEGORY_ORDER.map(cat => {
                        const fans = fansByCategory[cat];
                        if (!fans || fans.length === 0) return null;
                        return (
                            <div key={cat}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                                    {CATEGORY_NAMES[cat]}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {fans.map(fan => (
                                        <FanTag
                                            key={fan.id}
                                            fan={fan}
                                            isSelected={selectedFanIds.includes(fan.id)}
                                            onToggle={() => toggleFan(fan.id)}
                                            onInfo={() => setShowInfo(showInfo === fan.id ? null : fan.id)}
                                            showingInfo={showInfo === fan.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // Show filtered list
                    <div className="grid grid-cols-2 gap-2">
                        {filteredFans.map(fan => (
                            <FanTag
                                key={fan.id}
                                fan={fan}
                                isSelected={selectedFanIds.includes(fan.id)}
                                onToggle={() => toggleFan(fan.id)}
                                onInfo={() => setShowInfo(showInfo === fan.id ? null : fan.id)}
                                showingInfo={showInfo === fan.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FanTag({ 
    fan, 
    isSelected, 
    onToggle, 
    onInfo,
    showingInfo 
}: { 
    fan: FanType; 
    isSelected: boolean; 
    onToggle: () => void;
    onInfo: () => void;
    showingInfo: boolean;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative rounded-xl p-3 cursor-pointer transition-all",
                isSelected 
                    ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                    : "glass-card hover:ring-2 hover:ring-primary/50"
            )}
        >
            <div onClick={onToggle}>
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{fan.name}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        isSelected 
                            ? "bg-white/20" 
                            : "bg-primary/20 text-primary"
                    )}>
                        {fan.value}番
                    </span>
                </div>
                <div className={cn(
                    "text-xs",
                    isSelected ? "opacity-70" : "text-muted-foreground"
                )}>
                    {fan.nameEn}
                </div>
            </div>
            
            {/* Info toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onInfo();
                }}
                className={cn(
                    "absolute top-2 right-2 p-1 rounded-full transition-colors",
                    isSelected ? "hover:bg-white/20" : "hover:bg-white/10"
                )}
            >
                <Info size={12} className={showingInfo ? "text-primary" : ""} />
            </button>

            {/* Info Tooltip */}
            <AnimatePresence>
                {showingInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute left-0 right-0 top-full mt-1 p-2 rounded-lg bg-popover text-popover-foreground text-xs shadow-lg z-10 border border-border"
                    >
                        {fan.description}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selected indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                >
                    <Check size={12} className="text-white" />
                </motion.div>
            )}
        </motion.div>
    );
}

// Quick Fan Picker for common scenarios
export function QuickFanPicker({
    onSelect,
    className
}: {
    onSelect: (value: number) => void;
    className?: string;
}) {
    const quickValues = [3, 4, 5, 6, 7, 8, 10, 13];
    
    return (
        <div className={cn("grid grid-cols-4 gap-2", className)}>
            {quickValues.map(value => (
                <motion.button
                    key={value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(value)}
                    className="glass-card p-3 text-center font-mono font-bold text-lg hover:ring-2 hover:ring-primary/50 transition-all"
                >
                    {value}
                </motion.button>
            ))}
        </div>
    );
}
