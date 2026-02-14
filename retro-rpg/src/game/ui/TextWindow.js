export class TextWindow {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.text = '';
        this.displayedText = '';
        this.charIndex = 0;
        this.timer = 0;
        this.speed = 30; // ms per char
        this.callback = null;

        // Position and Size
        this.x = 20;
        this.y = 10;
        this.width = 216;
        this.height = 60;
        this.padding = 8;
    }

    show(text, callback = null) {
        this.text = text;
        this.displayedText = '';
        this.charIndex = 0;
        this.timer = 0;
        this.visible = true;
        this.callback = callback;
    }

    update(deltaTime) {
        if (!this.visible) return;

        if (this.charIndex < this.text.length) {
            this.timer += deltaTime;
            if (this.timer > this.speed) {
                this.displayedText += this.text[this.charIndex];
                this.charIndex++;
                this.timer = 0;
            }
            // Rapid advance
            if (this.game.input.isPressed('KeyZ')) {
                this.displayedText = this.text;
                this.charIndex = this.text.length;
            }
        } else {
            if (this.game.input.isPressed('KeyZ')) {
                this.visible = false;
                if (this.callback) this.callback();
            }
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        // Draw Window Background
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Border (White)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);

        // Draw Text
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P"';
        ctx.textBaseline = 'top';

        // Simple word wrap (optional, for now just basic multiline support via \n)
        const lines = this.displayedText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], this.x + this.padding, this.y + this.padding + (i * 12));
        }

        // Draw blinker when done
        if (this.charIndex >= this.text.length) {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(this.x + this.width - 10, this.y + this.height - 10, 6, 6);
            }
        }
    }
}
