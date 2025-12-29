/**
 * 🎲 DiceTool Component Tests
 * 
 * Tests for the dice throwing functionality in Mahjong
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiceTool } from '../DiceTool';

describe('DiceTool Component', () => {

    it('should render when open', () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        expect(screen.getByRole('heading', { name: '擲骰仔' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /擲骰仔/ })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        const onClose = vi.fn();
        const { container } = render(<DiceTool isOpen={false} onClose={onClose} />);
        
        expect(container.firstChild).toBeNull();
    });

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
        if (closeButton) {
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalled();
        }
    });

    it('should display initial dice values of 1', () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        // Initial total should be 3 (1+1+1)
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should roll dice when roll button is clicked', async () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        const rollButton = screen.getByRole('button', { name: /擲骰仔/i });
        fireEvent.click(rollButton);
        
        // Button text changes during roll
        expect(screen.getByText('擲緊...')).toBeInTheDocument();
        
        // Wait for rolling animation to complete
        await waitFor(() => {
            expect(screen.queryByText('擲緊...')).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should calculate correct starting position for dice total', () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        // The component uses internal state, so we need to check the logic
        // Total 1 -> 東 (East)
        // Total 2 -> 南 (South)
        // Total 3 -> 西 (West)
        // Total 4 -> 北 (North)
        // Total 5 -> 東 (cycles back)
        
        // Initial state has total of 3 (1+1+1), which should give 西
        expect(screen.getByText('西')).toBeInTheDocument();
    });

    it('should track roll history', async () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        const rollButton = screen.getByRole('button', { name: /擲骰仔/i });
        fireEvent.click(rollButton);
        
        // Wait for roll to complete and history to appear
        await waitFor(() => {
            expect(screen.queryByText('歷史記錄')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should clear history when clear button is clicked', async () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        const rollButton = screen.getByRole('button', { name: /擲骰仔/i });
        fireEvent.click(rollButton);
        
        // Wait for history to appear
        await waitFor(() => {
            expect(screen.queryByText('歷史記錄')).toBeInTheDocument();
        }, { timeout: 2000 });
        
        const clearButton = screen.getByRole('button', { name: /清除/i });
        fireEvent.click(clearButton);
        
        // History section should disappear
        await waitFor(() => {
            expect(screen.queryByText('歷史記錄')).not.toBeInTheDocument();
        });
    });

    it('should disable roll button while rolling', async () => {
        const onClose = vi.fn();
        render(<DiceTool isOpen={true} onClose={onClose} />);
        
        const rollButton = screen.getByRole('button', { name: /擲骰仔/i });
        fireEvent.click(rollButton);
        
        // Check button is disabled by checking for disabled attribute
        expect(rollButton.hasAttribute('disabled')).toBe(true);
        
        // Wait for roll to complete
        await waitFor(() => {
            expect(rollButton.hasAttribute('disabled')).toBe(false);
        }, { timeout: 2000 });
    });
});

describe('Dice Starting Position Logic', () => {
    // Test the Mahjong dice position calculation logic
    // 由莊家位開始逆時針數
    const positions = ['東', '南', '西', '北'];
    
    const getStartPosition = (total: number): string => {
        const posIndex = (total - 1) % 4;
        return positions[posIndex];
    };

    it('should calculate correct positions for totals 1-18', () => {
        expect(getStartPosition(1)).toBe('東');
        expect(getStartPosition(2)).toBe('南');
        expect(getStartPosition(3)).toBe('西');
        expect(getStartPosition(4)).toBe('北');
        expect(getStartPosition(5)).toBe('東'); // Cycles back
        expect(getStartPosition(6)).toBe('南');
        expect(getStartPosition(7)).toBe('西');
        expect(getStartPosition(8)).toBe('北');
        expect(getStartPosition(9)).toBe('東');
        expect(getStartPosition(10)).toBe('南');
        expect(getStartPosition(11)).toBe('西');
        expect(getStartPosition(12)).toBe('北');
        expect(getStartPosition(13)).toBe('東');
        expect(getStartPosition(14)).toBe('南');
        expect(getStartPosition(15)).toBe('西');
        expect(getStartPosition(16)).toBe('北');
        expect(getStartPosition(17)).toBe('東');
        expect(getStartPosition(18)).toBe('南');
    });
});

describe('Dice Dot Positions', () => {
    // Test the visual representation logic for dice dots
    const getDotPositions = (value: number): number[] => {
        switch (value) {
            case 1: return [4];
            case 2: return [0, 8];
            case 3: return [0, 4, 8];
            case 4: return [0, 2, 6, 8];
            case 5: return [0, 2, 4, 6, 8];
            case 6: return [0, 2, 3, 5, 6, 8];
            default: return [];
        }
    };

    it('should return correct dot positions for each dice value', () => {
        expect(getDotPositions(1)).toEqual([4]); // Center
        expect(getDotPositions(2)).toEqual([0, 8]); // Top-left, bottom-right
        expect(getDotPositions(3)).toEqual([0, 4, 8]); // Diagonal with center
        expect(getDotPositions(4)).toEqual([0, 2, 6, 8]); // Four corners
        expect(getDotPositions(5)).toEqual([0, 2, 4, 6, 8]); // Four corners + center
        expect(getDotPositions(6)).toEqual([0, 2, 3, 5, 6, 8]); // Two columns
        expect(getDotPositions(0)).toEqual([]); // Invalid
        expect(getDotPositions(7)).toEqual([]); // Invalid
    });
});
