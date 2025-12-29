"use client";

import { useGameStore } from "@/stores/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, MinusCircle, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Round } from "@/lib/engine/types";

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const WIND_LABELS: Record<string, string> = {
    east: "東",
    south: "南",
    west: "西",
    north: "北"
};

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-HK', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function RoundItem({ round, players, onUndo, isLast }: { 
    round: Round; 
    players: { id: string; name: string }[];
    onUndo?: () => void;
    isLast: boolean;
}) {
    const getPlayerName = (playerId: string) => {
        return players.find(p => p.id === playerId)?.name || '???';
    };

    if (round.outcome.type === 'draw') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-4 flex items-center gap-4"
            >
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                    <MinusCircle size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{WIND_LABELS[round.roundWind]}{round.roundNumber}</span>
                        <span className="text-muted-foreground">流局</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(round.timestamp)}
                    </div>
                </div>
                {isLast && onUndo && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onUndo}
                        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Undo2 size={18} />
                    </motion.button>
                )}
            </motion.div>
        );
    }

    const result = round.outcome.result;
    const winnerId = result.changes.find(c => c.delta > 0)?.playerId;
    const winnerName = winnerId ? getPlayerName(winnerId) : '???';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{WIND_LABELS[round.roundWind]}{round.roundNumber}</span>
                        <span className="text-primary font-medium">{winnerName}</span>
                        <span className="text-muted-foreground">食糊</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-secondary">{result.totalFan}番</span>
                        {result.fanDescription && (
                            <span className="text-xs text-muted-foreground">{result.fanDescription}</span>
                        )}
                    </div>
                </div>
                {isLast && onUndo && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onUndo}
                        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Undo2 size={18} />
                    </motion.button>
                )}
            </div>

            {/* Score changes */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {result.changes.map((change) => (
                    <div key={change.playerId} className="text-xs">
                        <div className="text-muted-foreground truncate">{getPlayerName(change.playerId)}</div>
                        <div className={cn(
                            "font-mono font-bold",
                            change.delta > 0 ? "text-green-400" : change.delta < 0 ? "text-red-400" : "text-muted-foreground"
                        )}>
                            {change.delta > 0 ? '+' : ''}{change.delta}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
    const game = useGameStore(state => state.game);
    const undoLastRound = useGameStore(state => state.undoLastRound);

    if (!game) return null;

    const { history, players } = game;
    const reversedHistory = [...history].reverse();

    const handleUndo = () => {
        if (confirm("確定要撤銷上一局嗎？")) {
            undoLastRound();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-0 bottom-0 w-full max-w-md glass-card rounded-r-2xl p-6 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">對局記錄</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Stats Summary */}
                        <div className="glass-card p-4 mb-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">{history.length}</div>
                                <div className="text-xs text-muted-foreground">總局數</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-secondary">
                                    {history.filter(r => r.outcome.type === 'win').length}
                                </div>
                                <div className="text-xs text-muted-foreground">食糊</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-muted-foreground">
                                    {history.filter(r => r.outcome.type === 'draw').length}
                                </div>
                                <div className="text-xs text-muted-foreground">流局</div>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {reversedHistory.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    暫無記錄
                                </div>
                            ) : (
                                reversedHistory.map((round, index) => (
                                    <RoundItem
                                        key={round.id}
                                        round={round}
                                        players={players}
                                        onUndo={index === 0 ? handleUndo : undefined}
                                        isLast={index === 0}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
