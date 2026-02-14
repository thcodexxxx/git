import { GAME_CONSTANTS, SYMBOL_COLORS, SYMBOL_NAMES } from '../config.js';

export class Reel {
    constructor(id, ctx, stripData, xOffset) {
        this.id = id;
        this.ctx = ctx;
        this.strip = stripData;
        this.xOffset = xOffset;

        this.totalHeight = this.strip.length * GAME_CONSTANTS.SYMBOL_HEIGHT;
        this.currentPosition = Math.random() * this.totalHeight;

        this.isSpinning = false;
        this.speed = 0;
        this.stopTarget = null;
        this.isStopping = false;
    }

    startSpin() {
        this.isSpinning = true;
        this.isStopping = false;
        this.stopTarget = null;
        this.speed = GAME_CONSTANTS.REEL_SPEED;
    }

    stop(targetIndex) {
        if (!this.isSpinning || this.isStopping) return;

        this.isStopping = true;

        // Calculate target relative to CURRENT cycle
        // targetIndex is 0..StripLength-1 (Top Visible Symbol)

        // Current position modulo height
        const currentMod = this.currentPosition % this.totalHeight;
        const targetMod = targetIndex * GAME_CONSTANTS.SYMBOL_HEIGHT;

        // Distance we need to travel to reach targetMod
        let distance = targetMod - currentMod;

        // If distance is negative (target is "behind" current in the loop), add full revolution
        if (distance <= 0) {
            distance += this.totalHeight;
        }

        // Optional: Ensure minimum spin distance (e.g. 1 frame worth)
        if (distance < this.speed) {
            distance += this.totalHeight;
        }

        this.stopTarget = this.currentPosition + distance;
    }

    update() {
        if (this.isSpinning) {
            this.currentPosition += this.speed;

            // Handle Wrap Around Logic
            // If NOT stopping, we can reset currentPosition to keep numbers small
            if (!this.isStopping && this.currentPosition >= this.totalHeight) {
                this.currentPosition %= this.totalHeight;
            }

            if (this.isStopping && this.stopTarget !== null) {
                if (this.currentPosition >= this.stopTarget) {
                    // SNAP to exact target
                    this.currentPosition = this.stopTarget;

                    // Normalize for next run
                    this.currentPosition %= this.totalHeight;

                    this.isSpinning = false;
                    this.isStopping = false;
                    this.speed = 0;
                }
            }
        }
    }

    draw() {
        const windowHeight = 400;
        const x = this.xOffset;

        // Visual position (wrapped)
        const drawnPosition = this.currentPosition % this.totalHeight;

        const offset = drawnPosition % GAME_CONSTANTS.SYMBOL_HEIGHT;
        const firstIndex = Math.floor(drawnPosition / GAME_CONSTANTS.SYMBOL_HEIGHT);

        const count = Math.ceil(windowHeight / GAME_CONSTANTS.SYMBOL_HEIGHT) + 1;

        for (let i = 0; i < count; i++) {
            let symbolIndex = (firstIndex + i) % this.strip.length;
            let symbolId = this.strip[symbolIndex];

            let y = (i * GAME_CONSTANTS.SYMBOL_HEIGHT) - offset;

            this.drawSymbol(symbolId, x, y);
        }
    }

    drawSymbol(id, x, y) {
        // Draw Background
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x, y, 200, GAME_CONSTANTS.SYMBOL_HEIGHT);

        // Symbol Color Box with some style
        this.ctx.fillStyle = SYMBOL_COLORS[id] || '#ccc';
        // Add a "shine" effect
        let gradient = this.ctx.createLinearGradient(x, y, x, y + GAME_CONSTANTS.SYMBOL_HEIGHT);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.2, SYMBOL_COLORS[id]);
        gradient.addColorStop(0.8, SYMBOL_COLORS[id]);
        gradient.addColorStop(1, '#000');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 10, y + 5, 180, GAME_CONSTANTS.SYMBOL_HEIGHT - 10);

        // Text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Roboto Mono';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(SYMBOL_NAMES[id], x + 100, y + (GAME_CONSTANTS.SYMBOL_HEIGHT / 2));
        this.ctx.shadowBlur = 0;
    }
}
