import { Reel } from './Reel.js';
import { Lottery } from './Lottery.js';
import { REEL_STRIPS, GAME_CONSTANTS } from '../config.js';

const STATE = {
    IDLE: 'IDLE',      // Waiting for bet
    BET: 'BET',        // Bet placed, waiting for lever
    LEVER_ON: 'LEVER_ON', // Lever pulled, lottery done, reels starting
    SPINNING: 'SPINNING', // Reels spinning, waiting for stops
    PAYOUT: 'PAYOUT'   // Reels stopped, checking win/loss
};

export class Machine {
    constructor(controlPanel, dataCounter) {
        this.controlPanel = controlPanel;
        this.dataCounter = dataCounter;

        this.lottery = new Lottery(1);

        this.canvas = document.getElementById('reels-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.reels = [];
        this.initReels();

        this.state = STATE.IDLE;

        // Game Data
        this.currentFlag = null;
        this.stopOrder = [];
        this.stoppedReels = 0;

        this.controlPanel.setCallbacks({
            onBet: () => this.onBet(),
            onLever: () => this.onLever(),
            onStop: (index) => this.onStop(index)
        });

        this.controlPanel.reset();
    }

    initReels() {
        // 3 Reels, total width 600
        const xOffsets = [0, 200, 400];
        for (let i = 0; i < 3; i++) {
            this.reels.push(new Reel(i, this.ctx, REEL_STRIPS[i], xOffsets[i]));
        }
    }

    start() {
        this.loop();
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.reels.forEach(reel => {
            reel.update();
            reel.draw();
        });

        // Check for all reels stopped
        if (this.state === STATE.SPINNING) {
            const allStopped = this.reels.every(r => !r.isSpinning && !r.isStopping);
            if (this.stoppedReels === 3 && allStopped) {
                this.gotoPayout();
            }
        }

        requestAnimationFrame(() => this.loop());
    }

    // --- State Transitions ---

    onBet() {
        if (this.state !== STATE.IDLE) return;

        if (this.dataCounter.data.credit < 3) {
            this.dataCounter.addCredit(50);
        }

        if (this.dataCounter.consumeCredit(3)) {
            this.state = STATE.BET;
            this.controlPanel.enableBet(false);
            this.controlPanel.enableLever(true);
        }
    }

    onLever() {
        if (this.state !== STATE.BET) return;

        this.state = STATE.LEVER_ON;
        this.controlPanel.enableLever(false);

        this.currentFlag = this.lottery.draw();
        console.log('Flag:', this.currentFlag);

        this.reels.forEach(r => r.startSpin());

        setTimeout(() => {
            this.state = STATE.SPINNING;
            this.controlPanel.enableAllStopButtons(true);
            this.stoppedReels = 0;
            this.stopOrder = [];
        }, 100);

        this.dataCounter.incrementGame();
    }

    onStop(reelIndex) {
        if (this.state !== STATE.SPINNING) return;

        const reel = this.reels[reelIndex];
        if (!reel.isSpinning || reel.isStopping) return;

        // Determine Stop Position

        // 1. Get current position normalized to 0..TotalHeight
        const currentMod = reel.currentPosition % reel.totalHeight;

        // 2. Determine nearest symbol index
        // This index refers to the symbol at the TOP of the window
        let targetIndex = Math.round(currentMod / GAME_CONSTANTS.SYMBOL_HEIGHT);

        // Normalize index to array length
        targetIndex = targetIndex % reel.strip.length;

        // TODO: Apply "Slippage" here based on currentFlag
        // e.g. if we need to align Bell, we might add +1 to targetIndex

        reel.stop(targetIndex);

        this.controlPanel.enableStopButton(reelIndex, false);
        this.stoppedReels++;
        this.stopOrder.push(reelIndex);
    }

    gotoPayout() {
        this.state = STATE.PAYOUT;

        setTimeout(() => {
            const payout = this.checkWin();

            if (payout > 0) {
                console.log(`WIN! ${payout} Credits`);
                this.dataCounter.setPayout(payout);
                this.dataCounter.addCredit(payout);
            }

            setTimeout(() => {
                this.resetRound();
            }, 1000);
        }, 300);
    }

    checkWin() {
        // Visible window = topIndex, topIndex+1 (Center), topIndex+2
        // We check index + 1

        const results = this.reels.map(reel => {
            // After stop, currentPosition is exactly at targetIndex * HEIGHT
            const index = Math.round(reel.currentPosition / GAME_CONSTANTS.SYMBOL_HEIGHT) % reel.strip.length;
            const centerIndex = (index + 1) % reel.strip.length;
            return reel.strip[centerIndex];
        });

        const [s1, s2, s3] = results;
        console.log('Center Line:', s1, s2, s3);

        // 3 of a kind
        if (s1 === s2 && s2 === s3) {
            if (s1 === 1) return 8; // Bell
            if (s1 === 0) return 0; // Replay
            if (s1 === 5) {
                this.dataCounter.addBig();
                return 0; // 777
            }
        }

        // Cherry (Left reel, center)
        if (s1 === 3) return 2;

        return 0;
    }

    resetRound() {
        this.state = STATE.IDLE;
        this.dataCounter.setPayout(0);
        this.controlPanel.reset();
    }
}
