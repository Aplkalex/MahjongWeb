"use client";

import { useGameStore } from "@/stores/gameStore";
import { PlayerCard } from "./PlayerCard";
import { CenterInfo } from "./CenterInfo";
import { HistoryPanel } from "./HistoryPanel";
import { WindProgress } from "./WindProgress";
import { WinFlowOverlay } from "@/components/flow/WinFlowOverlay";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { GameSetupFlow } from "@/components/setup/GameSetupFlow";
import { DiceTool } from "@/components/tools/DiceTool";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, BarChart3 } from "lucide-react";

export function GameBoard() {
    const game = useGameStore((state) => state.game);
    const startGame = useGameStore((state) => state.startGame);
    const startWinFlow = useGameStore((state) => state.startWinFlow);
    const preferredInputMode = useGameStore((state) => state.preferredInputMode);
    const recordDraw = useGameStore((state) => state.recordDraw);
    const undoLastRound = useGameStore((state) => state.undoLastRound);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isDiceOpen, setIsDiceOpen] = useState(false);
    const [isProgressOpen, setIsProgressOpen] = useState(false);

    // Show setup on first load if no game
    useEffect(() => {
        if (!game) {
            setIsSetupOpen(true);
        }
    }, []);

    // Fallback start game if setup cancelled
    const handleSetupCancel = () => {
        if (!game) {
            startGame();
        }
        setIsSetupOpen(false);
    };

    if (!game) {
        return (
            <>
                <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center">
                    <div className="text-muted-foreground">載入中...</div>
                </div>
                <AnimatePresence>
                    {isSetupOpen && (
                        <GameSetupFlow
                            isOpen={isSetupOpen}
                            onComplete={() => setIsSetupOpen(false)}
                            onCancel={handleSetupCancel}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    const { players, dealerSeatIndex, roundWind, roundNumber, dealerContinueCount, history } = game;
    const canUndo = history.length > 0;

    const getWind = (idx: number) => {
        const windIdx = (idx - dealerSeatIndex + 4) % 4;
        const winds: ('east' | 'south' | 'west' | 'north')[] = ['east', 'south', 'west', 'north'];
        return winds[windIdx];
    };

    const handleDraw = () => {
        if (confirm("確定流局？")) {
            recordDraw();
        }
    };

    const handleUndo = () => {
        if (confirm("確定要撤銷上一局嗎？")) {
            undoLastRound();
        }
    };

    return (
        <div className="min-h-[100dvh] w-full bg-background p-4 md:p-8 flex items-center justify-center">
            {/* Main Grid Container */}
            <div className="w-full max-w-4xl">
                {/* 3x3 Grid for Desktop, Stack for Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* Top Row - Player 2 (Opposite) */}
                    <div className="hidden md:block" /> {/* Empty cell */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-start-2"
                    >
                        <PlayerCard
                            player={players[2]}
                            wind={getWind(2)}
                            isDealer={dealerSeatIndex === 2}
                        />
                    </motion.div>
                    <div className="hidden md:block" /> {/* Empty cell */}

                    {/* Middle Row - Player 3, Center, Player 1 */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:flex items-center"
                    >
                        <PlayerCard
                            player={players[3]}
                            wind={getWind(3)}
                            isDealer={dealerSeatIndex === 3}
                            className="w-full"
                        />
                    </motion.div>

                    {/* Center */}
                    <div className="flex items-center justify-center py-8 md:py-0">
                        <CenterInfo
                            roundWind={roundWind}
                            roundNumber={roundNumber}
                            dealerCount={dealerContinueCount}
                            onWin={() => startWinFlow(preferredInputMode)}
                            onDraw={handleDraw}
                            onUndo={handleUndo}
                            onHistory={() => setIsHistoryOpen(true)}
                            canUndo={canUndo}
                            onDice={() => setIsDiceOpen(true)}
                            onProgress={() => setIsProgressOpen(true)}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:flex items-center"
                    >
                        <PlayerCard
                            player={players[1]}
                            wind={getWind(1)}
                            isDealer={dealerSeatIndex === 1}
                            className="w-full"
                        />
                    </motion.div>

                    {/* Bottom Row - Player 0 (Self) */}
                    <div className="hidden md:block" /> {/* Empty cell */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-start-2"
                    >
                        <PlayerCard
                            player={players[0]}
                            wind={getWind(0)}
                            isDealer={dealerSeatIndex === 0}
                            isActive
                        />
                    </motion.div>
                    <div className="hidden md:block" /> {/* Empty cell */}

                    {/* Mobile: Show side players below */}
                    <div className="grid grid-cols-2 gap-4 md:hidden">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <PlayerCard
                                player={players[3]}
                                wind={getWind(3)}
                                isDealer={dealerSeatIndex === 3}
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <PlayerCard
                                player={players[1]}
                                wind={getWind(1)}
                                isDealer={dealerSeatIndex === 1}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <WinFlowOverlay />
            <SettingsPanel />
            <HistoryPanel 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
            />
            
            {/* Setup Flow */}
            <AnimatePresence>
                {isSetupOpen && (
                    <GameSetupFlow
                        isOpen={isSetupOpen}
                        onComplete={() => setIsSetupOpen(false)}
                        onCancel={handleSetupCancel}
                    />
                )}
            </AnimatePresence>

            {/* Dice Tool Modal */}
            <AnimatePresence>
                {isDiceOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsDiceOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DiceTool isOpen={isDiceOpen} onClose={() => setIsDiceOpen(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wind Progress Modal */}
            <AnimatePresence>
                {isProgressOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsProgressOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
                        >
                            <WindProgress 
                                currentWind={roundWind} 
                                roundNumber={roundNumber}
                                dealerSeatIndex={dealerSeatIndex}
                            />
                            <div className="text-center mt-4 text-muted-foreground text-sm">
                                點擊任意處關閉
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
