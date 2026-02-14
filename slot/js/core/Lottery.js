import { PROBABILITIES } from '../config.js';

export class Lottery {
    constructor(setting = 1) {
        this.setting = setting;
        // Current table
        this.table = PROBABILITIES.NORMAL[this.setting];
    }

    /**
     * Draw a flag for the current game.
     * Returns: { type: 'REPLAY' | 'BELL' | ... , hit: boolean }
     */
    draw() {
        // 16-bit RNG (0 - 65535)
        const rand = Math.floor(Math.random() * 65536);

        // Check sequentially against table
        // This is a simplified cumulative check.

        let cumulative = 0;

        // Order matters: Rares first usually, but for simple check:
        // REPLAY -> BELL -> CHERRY -> SUICA ...

        // Define priority order for checking
        const checkOrder = ['REPLAY', 'BELL', 'CHERRY', 'SUICA', 'CZ_TRIGGER'];

        for (const flagName of checkOrder) {
            const probability = this.table[flagName];
            if (rand < cumulative + probability) {
                return { type: flagName, hit: true };
            }
            cumulative += probability;
        }

        return { type: 'HAZURE', hit: false };
    }

    setSetting(newSetting) {
        if (PROBABILITIES.NORMAL[newSetting]) {
            this.setting = newSetting;
            this.table = PROBABILITIES.NORMAL[this.setting];
        }
    }
}
