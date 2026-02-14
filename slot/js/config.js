/**
 * Slot Machine Configuration
 */

// Symbol Definitions
export const SYMBOLS = {
    REPLAY: 0,
    BELL: 1,
    SUICA: 2,   // Watermelon (Rare)
    CHERRY: 3,  // Cherry (Rare)
    BAR: 4,     // Bonus Symbol
    SEVEN: 5,   // Bonus Symbol
    DUMMY: 6    // Placeholder/Blank
};

export const SYMBOL_NAMES = {
    0: 'REPLAY',
    1: 'BELL',
    2: 'SUICA',
    3: 'CHERRY',
    4: 'BAR',
    5: 'SEVEN',
    6: 'BLANK'
};

export const SYMBOL_COLORS = {
    0: '#00ccff', // Replay Blue
    1: '#ffd700', // Bell Gold
    2: '#00ff00', // Suica Green
    3: '#ff0000', // Cherry Red
    4: '#000000', // BAR Black
    5: '#ff0055', // Seven Pink/Red
    6: '#333333'  // Blank
};

export const PAYOUTS = {
    REPLAY: 0,  // Replay
    BELL: 8,    // 8 coins
    SUICA: 5,   // 5 coins
    CHERRY: 2,  // 2 coins
    BAR: 0,     // Bonus Trigger
    SEVEN: 0    // Bonus Trigger
};

// Reel Strips (20 symbols per reel)
// Simplified generic arrangement
export const REEL_STRIPS = [
    // Left Reel
    [
        SYMBOLS.SEVEN, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.CHERRY, SYMBOLS.BELL,
        SYMBOLS.REPLAY, SYMBOLS.SUICA, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.BAR,
        SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.CHERRY, SYMBOLS.BELL, SYMBOLS.REPLAY,
        SYMBOLS.SUICA, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.SEVEN, SYMBOLS.BELL
    ],
    // Center Reel
    [
        SYMBOLS.SEVEN, SYMBOLS.REPLAY, SYMBOLS.BELL, SYMBOLS.SUICA, SYMBOLS.REPLAY,
        SYMBOLS.BELL, SYMBOLS.CHERRY, SYMBOLS.REPLAY, SYMBOLS.BELL, SYMBOLS.BAR,
        SYMBOLS.REPLAY, SYMBOLS.BELL, SYMBOLS.SUICA, SYMBOLS.REPLAY, SYMBOLS.BELL,
        SYMBOLS.CHERRY, SYMBOLS.REPLAY, SYMBOLS.BELL, SYMBOLS.SEVEN, SYMBOLS.REPLAY
    ],
    // Right Reel
    [
        SYMBOLS.SEVEN, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.SUICA, SYMBOLS.BELL,
        SYMBOLS.REPLAY, SYMBOLS.CHERRY, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.BAR,
        SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.SUICA, SYMBOLS.BELL, SYMBOLS.REPLAY,
        SYMBOLS.CHERRY, SYMBOLS.BELL, SYMBOLS.REPLAY, SYMBOLS.SEVEN, SYMBOLS.BELL
    ]
];

// Probability Tables (Denominator: 65536)
// Setting differences
export const PROBABILITIES = {
    // Normal Mode
    NORMAL: {
        1: {
            REPLAY: 8978,  // ~1/7.3
            BELL: 6553,    // ~1/10 (Normally higher, but simplified)
            CHERRY: 1024,  // ~1/64
            SUICA: 512,    // ~1/128
            CZ_TRIGGER: 100 // Low chance
        },
        6: {
            REPLAY: 8978,
            BELL: 7000,    // Better bell rate
            CHERRY: 1200,
            SUICA: 600,
            CZ_TRIGGER: 250 // Higher CZ chance
        }
    }
};

export const GAME_CONSTANTS = {
    REEL_SPEED: 24,       // Pixels per frame (approx)
    SLIP_FRAMES: 4,       // Max slip
    SYMBOL_HEIGHT: 60,    // Height of one symbol in pixels
    VISIBLE_SYMBOLS: 3    // Number of symbols visible in window
};
