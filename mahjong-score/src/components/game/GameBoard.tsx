"use client";

import { useGameStore } from "@/stores/gameStore";
import { PlayerCard } from "./PlayerCard";
import { CenterInfo } from "./CenterInfo";
import { WinFlowOverlay } from "@/components/flow/WinFlowOverlay";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function GameBoard() {
    const game = useGameStore((state) => state.game);
    const startGame = useGameStore((state) => state.startGame);
    const startWinFlow = useGameStore((state) => state.startWinFlow);
    const preferredInputMode = useGameStore((state) => state.preferredInputMode);
    const recordDraw = useGameStore((state) => state.recordDraw);

    // Auto start
    useEffect(() => {
        if (!game) {
            startGame();
        }
    }, [game, startGame]);

    if (!game) return null;

    const { players, dealerSeatIndex, roundWind, roundNumber, dealerContinueCount } = game;

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
        </div>
    );
}
