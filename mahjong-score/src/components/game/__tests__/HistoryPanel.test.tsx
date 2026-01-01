/**
 * 📜 HistoryPanel Component Tests
 *
 * Covers Phase 4: history list, undo entry point, and expand details.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HistoryPanel } from '../HistoryPanel';
import { useGameStore } from '@/stores/gameStore';

function seedGameWithOneWinRound() {
    const now = Date.now();

    // Start from a minimal, deterministic state.
    useGameStore.setState({
        settings: {
            ruleSetId: 'cantonese',
            scoringConfig: {
                baseScore: 1,
                minFan: 3,
                maxFan: 13,
                startingScore: 500,
                variant: 'standard',
                paymentMode: 'full',
                escalationMode: 'double',
            },
            playerNames: ['東', '南', '西', '北'],
            startingScore: 500,
        },
        preferredInputMode: 'pro',
        winFlow: null,
        game: {
            id: 'g1',
            ruleSetId: 'cantonese',
            players: [
                { id: 'p0', seatIndex: 0, name: '東', score: 596 },
                { id: 'p1', seatIndex: 1, name: '南', score: 468 },
                { id: 'p2', seatIndex: 2, name: '西', score: 468 },
                { id: 'p3', seatIndex: 3, name: '北', score: 468 },
            ],
            dealerSeatIndex: 0,
            roundWind: 'east',
            roundNumber: 2,
            dealerContinueCount: 1,
            history: [
                {
                    id: 'r1',
                    roundNumber: 1,
                    roundWind: 'east',
                    dealerSeatIndex: 0,
                    description: '東 自摸 5番',
                    outcome: {
                        type: 'win',
                        result: {
                            totalFan: 5,
                            basePoints: 32,
                            fanDescription: '清一色',
                            changes: [
                                { playerId: 'p0', delta: 96, newScore: 596 },
                                { playerId: 'p1', delta: -32, newScore: 468 },
                                { playerId: 'p2', delta: -32, newScore: 468 },
                                { playerId: 'p3', delta: -32, newScore: 468 },
                            ],
                            isDealerWin: true,
                        },
                    },
                    timestamp: now,
                },
            ],
            createdAt: now,
            updatedAt: now,
        },
    });
}

describe('HistoryPanel', () => {
    beforeEach(() => {
        // Reset to a safe baseline between tests.
        useGameStore.setState({
            game: null,
            winFlow: null,
            preferredInputMode: 'pro',
            settings: {
                ruleSetId: 'cantonese',
                scoringConfig: {
                    baseScore: 1,
                    minFan: 3,
                    maxFan: 13,
                    startingScore: 500,
                    variant: 'standard',
                    paymentMode: 'full',
                    escalationMode: 'double',
                },
                playerNames: ['東', '南', '西', '北'],
                startingScore: 500,
            },
        } as any);

        vi.restoreAllMocks();
    });

    it('renders empty state when no history', () => {
        // Set an active game but no rounds.
        const now = Date.now();
        useGameStore.setState({
            game: {
                id: 'g0',
                ruleSetId: 'cantonese',
                players: [
                    { id: 'p0', seatIndex: 0, name: '東', score: 500 },
                    { id: 'p1', seatIndex: 1, name: '南', score: 500 },
                    { id: 'p2', seatIndex: 2, name: '西', score: 500 },
                    { id: 'p3', seatIndex: 3, name: '北', score: 500 },
                ],
                dealerSeatIndex: 0,
                roundWind: 'east',
                roundNumber: 1,
                dealerContinueCount: 0,
                history: [],
                createdAt: now,
                updatedAt: now,
            },
        } as any);

        render(<HistoryPanel isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText('暫無記錄')).toBeInTheDocument();
    });

    it('shows a win round and expands to show details and description', () => {
        seedGameWithOneWinRound();

        render(<HistoryPanel isOpen={true} onClose={vi.fn()} />);

        // Summary line
        expect(screen.getByText('東1')).toBeInTheDocument();
        expect(screen.getAllByText('食糊').length).toBeGreaterThan(0);
        expect(screen.getByText('5番')).toBeInTheDocument();

        // Expand by clicking the row
        fireEvent.click(screen.getByText('東1'));

        expect(screen.getByText('分數明細')).toBeInTheDocument();
        expect(screen.getByText('底分')).toBeInTheDocument();
        expect(screen.getByText('32')).toBeInTheDocument();
        expect(screen.getByText('莊家')).toBeInTheDocument();
        expect(screen.getByText('描述')).toBeInTheDocument();
        expect(screen.getByText('東 自摸 5番')).toBeInTheDocument();

        // One player breakdown example: old -> new (delta)
        expect(screen.getAllByText('500').length).toBeGreaterThanOrEqual(4);
        expect(screen.getAllByText('→').length).toBeGreaterThanOrEqual(4);
        expect(screen.getByText('596')).toBeInTheDocument();
    });

    it('undo button prompts and calls store undo for the most recent round', () => {
        seedGameWithOneWinRound();

        const onClose = vi.fn();
        const undoSpy = vi.spyOn(useGameStore.getState(), 'undoLastRound');
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<HistoryPanel isOpen={true} onClose={onClose} />);

        const undoButton = screen.getByRole('button', { name: '撤銷上一局' });
        fireEvent.click(undoButton);

        expect(window.confirm).toHaveBeenCalled();
        expect(undoSpy).toHaveBeenCalled();
    });
});
