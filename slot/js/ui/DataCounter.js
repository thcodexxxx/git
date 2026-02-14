export class DataCounter {
    constructor() {
        this.elements = {
            game: document.getElementById('game-count'),
            big: document.getElementById('big-count'),
            reg: document.getElementById('reg-count'),
            art: document.getElementById('art-count'),
            credit: document.getElementById('credit-val'),
            payout: document.getElementById('payout-val')
        };

        this.data = {
            game: 0,
            big: 0,
            reg: 0,
            art: 0,
            credit: 50,
            payout: 0
        };
    }

    updateDisplay() {
        this.elements.game.textContent = this.data.game;
        this.elements.big.textContent = this.data.big;
        this.elements.reg.textContent = this.data.reg;
        this.elements.art.textContent = this.data.art;
        this.elements.credit.textContent = this.data.credit;
        this.elements.payout.textContent = this.data.payout;
    }

    incrementGame() {
        this.data.game++;
        this.updateDisplay();
    }

    resetGame() {
        this.data.game = 0;
        this.updateDisplay();
    }

    addBig() {
        this.data.big++;
        this.resetGame();
    }

    addReg() {
        this.data.reg++;
        this.resetGame();
    }

    addCredit(amount) {
        this.data.credit += amount;
        if (this.data.credit > 50) {
            // Pay out excess
            const excess = this.data.credit - 50;
            this.data.credit = 50;
            // logic to handle physical payout simulation if needed
        }
        this.updateDisplay();
    }

    consumeCredit(amount) {
        if (this.data.credit >= amount) {
            this.data.credit -= amount;
            this.updateDisplay();
            return true;
        }
        return false;
    }

    setPayout(amount) {
        this.data.payout = amount;
        this.updateDisplay();
    }
}
