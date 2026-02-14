import { Scene } from '../../engine/Scene.js';
import { MapScene } from './MapScene.js';

export class TitleScene extends Scene {
    constructor(game) {
        super(game);
        this.blinkTimer = 0;
        this.showText = true;
    }

    update(deltaTime) {
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 500) {
            this.showText = !this.showText;
            this.blinkTimer = 0;
        }

        if (this.game.input.isPressed('Enter') || this.game.input.isPressed('Space') || this.game.input.isPressed('KeyZ')) {
            console.log('Start Game!');
            this.game.changeScene(new MapScene(this.game));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';

        ctx.font = '20px "Press Start 2P"';
        ctx.fillText('RETRO RPG', this.game.width / 2, 80);

        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('LEGEND OF THE HERO', this.game.width / 2, 110);

        if (this.showText) {
            ctx.fillText('PRESS START', this.game.width / 2, 180);
        }

        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('© 2026 ANTIGRAVITY', this.game.width / 2, 220);
    }
}
