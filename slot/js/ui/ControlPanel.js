export class ControlPanel {
    constructor() {
        // Elements
        this.maxBetBtn = document.getElementById('max-bet-btn');
        this.lever = document.getElementById('lever');
        this.stopButtons = [
            document.getElementById('stop-left'),
            document.getElementById('stop-center'),
            document.getElementById('stop-right')
        ];

        // State
        this.callbacks = {
            onBet: null,
            onLever: null,
            onStop: null
        };

        this.initListeners();
    }

    initListeners() {
        // Bet Button
        this.maxBetBtn.addEventListener('click', () => {
            if (this.callbacks.onBet) this.callbacks.onBet();
        });

        // Lever
        this.lever.addEventListener('mousedown', () => {
            this.lever.style.transform = 'rotateX(20deg)'; // Visual feedback
        });
        this.lever.addEventListener('mouseup', () => {
            this.lever.style.transform = 'none';
            if (this.callbacks.onLever) this.callbacks.onLever();
        });

        // Stop Buttons
        this.stopButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('disabled') && this.callbacks.onStop) {
                    this.callbacks.onStop(index);
                }
            });
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // UI State Management helpers
    enableBet(enabled) {
        this.maxBetBtn.disabled = !enabled;
        this.maxBetBtn.classList.toggle('disabled', !enabled);
    }

    enableLever(enabled) {
        this.lever.style.pointerEvents = enabled ? 'auto' : 'none';
        this.lever.classList.toggle('disabled', !enabled);
    }

    enableStopButton(index, enabled) {
        const btn = this.stopButtons[index];
        btn.disabled = !enabled;
        btn.classList.toggle('disabled', !enabled);
    }

    enableAllStopButtons(enabled) {
        this.stopButtons.forEach((btn, i) => this.enableStopButton(i, enabled));
    }

    reset() {
        this.enableBet(true);
        this.enableLever(false);
        this.enableAllStopButtons(false);
    }
}
