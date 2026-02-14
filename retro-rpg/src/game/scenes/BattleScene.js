import { Scene } from '../../engine/Scene.js';

export class BattleScene extends Scene {
    constructor(game, enemyType) {
        super(game);
        this.enemyType = enemyType; // 'Slime', 'Dragon', etc.
        this.turn = 'PLAYER'; // PLAYER, ENEMY, WIN, LOSE, WAITING

        // Stats
        this.playerHP = 20;
        this.playerMaxHP = 20;
        this.enemyHP = 10;
        this.enemyMaxHP = 10;

        if (enemyType === 'Dragon') {
            this.enemyHP = 100;
            this.enemyMaxHP = 100;
        }

        this.log = [`${enemyType} approaches!`];
        this.menuIndex = 0;
        this.menuOptions = ['FIGHT', 'MAGIC', 'ITEM', 'RUN'];
    }

    init() {
        console.log('Battle Started against', this.enemyType);
    }

    update(deltaTime) {
        if (this.turn === 'PLAYER') {
            if (this.game.input.isPressed('ArrowUp')) {
                this.menuIndex = (this.menuIndex - 1 + 4) % 4;
            } else if (this.game.input.isPressed('ArrowDown')) {
                this.menuIndex = (this.menuIndex + 1) % 4;
            } else if (this.game.input.isPressed('KeyZ')) {
                this.executePlayerAction();
            }
        } else if (this.turn === 'ENEMY') {
            // Simple delay for enemy turn
            setTimeout(() => {
                this.enemyAttack();
            }, 1000);
            this.turn = 'WAITING'; // Prevent multiple timeouts
        } else if (this.turn === 'WIN' || this.turn === 'LOSE') {
            if (this.game.input.isPressed('KeyZ')) {
                // Return to map
                if (this.turn === 'WIN') {
                    // TODO: Award XP
                }
                this.game.changeScene(this.game.previousScene);
            }
        }
    }

    executePlayerAction() {
        const action = this.menuOptions[this.menuIndex];
        if (action === 'FIGHT') {
            const damage = Math.floor(Math.random() * 4) + 2; // 2-5 damage
            this.enemyHP -= damage;
            this.log.push(`You attack! ${damage} damage!`);

            if (this.enemyHP <= 0) {
                this.enemyHP = 0;
                this.log.push('You won!');
                this.log.push('Press Z to continue...');
                this.turn = 'WIN';
            } else {
                this.turn = 'ENEMY';
            }
        } else if (action === 'RUN') {
            this.log.push('You ran away!');
            setTimeout(() => {
                this.game.changeScene(this.game.previousScene); // Heuristic: return to map
            }, 1000);
            this.turn = 'WAITING';
        } else {
            this.log.push('Not implemented yet!');
            this.turn = 'PLAYER'; // Allow retry
        }
    }

    enemyAttack() {
        const damage = Math.floor(Math.random() * 3) + 1; // 1-3 damage
        this.playerHP -= damage;
        this.log.push(`${this.enemyType} attacks! ${damage} damage!`);

        if (this.playerHP <= 0) {
            this.playerHP = 0;
            this.log.push('You died...');
            this.log.push('Press Z to restart...');
            this.turn = 'LOSE';
        } else {
            this.turn = 'PLAYER';
        }
    }

    draw(ctx) {
        // Draw Black Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Draw Enemy
        const sprites = this.game.assets.getImage('sprites');
        // Slime: Row 4 (index 3), Col 0? No, let's use a placeholder rect if sprite not ready
        // Assuming Slime is at 0, 80 (Row 5)
        ctx.drawImage(sprites, 0, 80, 16, 16, this.game.width / 2 - 32, 60, 64, 64);

        // Draw UI Box
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 140, this.game.width - 20, 90);

        // Draw Log
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'left';
        for (let i = 0; i < Math.min(this.log.length, 3); i++) {
            // Show last 3 messages
            const msg = this.log[this.log.length - 1 - i];
            ctx.fillText(msg, 20, 160 + (i * 12));
        }

        // Draw Command Menu
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 10, 80, 80);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(10, 10, 80, 80);

        ctx.fillStyle = '#fff';
        for (let i = 0; i < this.menuOptions.length; i++) {
            ctx.fillText(this.menuOptions[i], 30, 30 + (i * 15));
            if (i === this.menuIndex) {
                ctx.fillText('>', 15, 30 + (i * 15));
            }
        }

        // Draw Stats
        ctx.fillText(`HP: ${this.playerHP}/${this.playerMaxHP}`, 100, 20);
    }
}
