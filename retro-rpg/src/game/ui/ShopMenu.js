import { TextWindow } from './TextWindow.js';

export class ShopMenu {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.items = [
            { name: 'どうのつるぎ', cost: 50, power: 5, type: 'WEAPON' },
            { name: 'かわのよろい', cost: 50, def: 5, type: 'ARMOR' },
            { name: 'やくそう', cost: 10, heal: 10, type: 'ITEM' }
        ];
        this.menuIndex = 0;
        this.textWindow = new TextWindow(game);
        // Custom position for shop text
        this.textWindow.y = 140;
    }

    show() {
        this.visible = true;
        this.menuIndex = 0;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime) {
        if (!this.visible) return;

        if (this.game.input.isPressed('ArrowUp')) {
            this.menuIndex = (this.menuIndex - 1 + this.items.length + 1) % (this.items.length + 1); // +1 for Exit
        } else if (this.game.input.isPressed('ArrowDown')) {
            this.menuIndex = (this.menuIndex + 1) % (this.items.length + 1);
        } else if (this.game.input.isPressed('KeyZ')) {
            this.buyItem();
        } else if (this.game.input.isPressed('KeyX')) {
            this.hide();
        }
    }

    buyItem() {
        if (this.menuIndex === this.items.length) {
            this.hide();
            return;
        }

        const item = this.items[this.menuIndex];
        if (this.game.player.stats.gold >= item.cost) {
            this.game.player.stats.gold -= item.cost;
            if (item.type === 'WEAPON') {
                this.game.player.stats.str += item.power;
                this.textWindow.show(`${item.name}を かった！\nこうげきりょくが あがった！`);
            } else if (item.type === 'ARMOR') {
                this.game.player.stats.def += item.def; // Simplified: Add to def directly
                this.textWindow.show(`${item.name}を かった！\nしゅびりょくが あがった！`);
            } else {
                this.game.player.stats.hp = Math.min(this.game.player.stats.maxHp, this.game.player.stats.hp + item.heal);
                this.textWindow.show(`${item.name}を つかった！\nHPが かいふくした！`);
            }
        } else {
            this.textWindow.show('おかねが たりない！');
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        // Draw Shop Box
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 10, 200, 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 200, 100);

        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P"';

        ctx.fillText(`Gold: ${this.game.player.stats.gold} G`, 140, 25);

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            ctx.fillText(`${item.name}`, 30, 30 + (i * 15));
            ctx.fillText(`${item.cost} G`, 160, 30 + (i * 15));

            if (i === this.menuIndex) {
                ctx.fillText('>', 15, 30 + (i * 15));
            }
        }

        // Exit option
        ctx.fillText('やめる', 30, 30 + (this.items.length * 15));
        if (this.menuIndex === this.items.length) {
            ctx.fillText('>', 15, 30 + (this.items.length * 15));
        }

        // Draw Text Window overlay if active
        if (this.textWindow.visible) {
            this.textWindow.draw(ctx);
            // Need to update text window here too if we want animations, or handle in scene
            this.textWindow.update(16); // Hacky update for blink/type
        }
    }
}
