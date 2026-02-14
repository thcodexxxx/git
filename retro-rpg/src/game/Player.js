export class Player {
    constructor(game) {
        this.game = game;
        this.x = 1; // Grid coordinates
        this.y = 1;
        this.pixelX = this.x * 16;
        this.pixelY = this.y * 16;
        this.isMoving = false;
        this.moveSpeed = 2; // Pixels per frame
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        this.direction = 0; // 0: Down, 1: Up, 2: Left, 3: Right

        // RPG Stats
        this.stats = {
            level: 1,
            hp: 20,
            maxHp: 20,
            mp: 0,
            maxMp: 0,
            str: 5,
            def: 5,
            xp: 0,
            nextLevelXp: 10,
            gold: 0
        };
    }

    gainXp(amount) {
        this.stats.xp += amount;
        console.log(`Gained ${amount} XP. Total: ${this.stats.xp}`);
        if (this.stats.xp >= this.stats.nextLevelXp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.stats.level++;
        this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);

        // Stat growth
        this.stats.maxHp += Math.floor(Math.random() * 5) + 3;
        this.stats.maxMp += Math.floor(Math.random() * 3) + 1;
        this.stats.str += Math.floor(Math.random() * 2) + 1;
        this.stats.def += Math.floor(Math.random() * 2) + 1;

        // Full heal
        this.stats.hp = this.stats.maxHp;
        this.stats.mp = this.stats.maxMp;

        console.log(`Level Up! reached level ${this.stats.level}`);
        // TODO: Show level up message
    }

    update(deltaTime) {
        if (this.isMoving) {
            this.moveTowardsTarget();
        } else {
            this.handleInput();
        }
    }

    handleInput() {
        let dx = 0;
        let dy = 0;

        if (this.game.input.isDown('ArrowUp')) {
            dy = -1;
            this.direction = 1;
        } else if (this.game.input.isDown('ArrowDown')) {
            dy = 1;
            this.direction = 0;
        } else if (this.game.input.isDown('ArrowLeft')) {
            dx = -1;
            this.direction = 2;
        } else if (this.game.input.isDown('ArrowRight')) {
            dx = 1;
            this.direction = 3;
        }

        if (dx !== 0 || dy !== 0) {
            const targetX = this.x + dx;
            const targetY = this.y + dy;

            // Simple boundary check
            if (!this.game.currentScene.isSolid(targetX, targetY)) {
                this.x = targetX;
                this.y = targetY;
                this.targetPixelX = this.x * 16;
                this.targetPixelY = this.y * 16;
                this.isMoving = true;
            }
        }
    }

    moveTowardsTarget() {
        if (this.pixelX < this.targetPixelX) {
            this.pixelX += this.moveSpeed;
            if (this.pixelX > this.targetPixelX) this.pixelX = this.targetPixelX;
        } else if (this.pixelX > this.targetPixelX) {
            this.pixelX -= this.moveSpeed;
            if (this.pixelX < this.targetPixelX) this.pixelX = this.targetPixelX;
        }

        if (this.pixelY < this.targetPixelY) {
            this.pixelY += this.moveSpeed;
            if (this.pixelY > this.targetPixelY) this.pixelY = this.targetPixelY;
        } else if (this.pixelY > this.targetPixelY) {
            this.pixelY -= this.moveSpeed;
            if (this.pixelY < this.targetPixelY) this.pixelY = this.targetPixelY;
        }

        if (this.pixelX === this.targetPixelX && this.pixelY === this.targetPixelY) {
            this.isMoving = false;
        }
    }

    draw(ctx) {
        const sprites = this.game.assets.getImage('sprites');
        // Assuming Row 1 (index 0) for Hero
        // Frame 0: Front, 1: Back, 2: Left, 3: Right
        let sx = this.direction * 16;
        let sy = 0;

        ctx.drawImage(sprites, sx, sy, 16, 16, Math.round(this.pixelX), Math.round(this.pixelY), 16, 16);
    }
}
