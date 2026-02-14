import { Scene } from '../../engine/Scene.js';
import { TextWindow } from '../ui/TextWindow.js';
import { ShopMenu } from '../ui/ShopMenu.js';

export class MapScene extends Scene {
    constructor(game) {
        super(game);
        this.tileWidth = 16;
        this.tileHeight = 16;
        this.map = [
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 9, 3, 3, 0, 0, 0, 0, 2], // 9: Castle/King
            [2, 0, 0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2], // 4: Sign?
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 5, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        ];
        // 0: Grass, 1: Water, 2: Mountain, 3: Forest, 4: Castle, 5: Town, 9: King

        this.player = game.player;
        // Start player near castle
        this.player.x = 7;
        this.player.y = 5;
        this.player.pixelX = this.player.x * 16;
        this.player.pixelY = this.player.y * 16;
        this.player.targetPixelX = this.player.pixelX;
        this.player.targetPixelY = this.player.pixelY;

        this.cameraX = 0;
        this.cameraY = 0;

        this.ui = new TextWindow(game);
        this.shop = new ShopMenu(game);
    }

    init() {
        console.log('Map Scene Initialized');
        // Intro dialogue
        this.ui.show('おお ゆうしゃよ！\nしんでしまうとは なにごとだ！\n...いや まだ しんでおらんか。');
    }

    update(deltaTime) {
        if (this.ui.visible) {
            this.ui.update(deltaTime);
            return;
        }

        if (this.shop.visible) {
            this.shop.update(deltaTime);
            return;
        }

        this.player.update(deltaTime);
        this.updateCamera();

        // Check interaction
        if (this.game.input.isPressed('KeyZ')) {
            this.checkInteraction();
        }

        // Random Encounter Check (only when moving)
        if (this.player.isMoving && Math.random() < 0.005) { // 0.5% chance
            console.log('Random Encounter!');
            this.game.previousScene = this;
            import('./BattleScene.js').then(module => {
                this.game.changeScene(new module.BattleScene(this.game, 'Slime'));
            });
        }

        if (this.game.input.isPressed('KeyX')) {
            console.log('Menu opened');
        }
    }

    checkInteraction() {
        // Simple check: is there an event at current or facing tile?
        // For now, check current tile
        const tile = this.map[this.player.y][this.player.x];

        if (tile === 9) { // King
            this.ui.show(`おお ゆうしゃよ！\nレベル: ${this.player.stats.level}\nつぎのレベルまで: ${this.player.stats.nextLevelXp - this.player.stats.xp}`);
        } else if (tile === 6) { // Inn
            this.ui.show('宿屋に泊まって回復した！');
            this.player.stats.hp = this.player.stats.maxHp;
            this.player.stats.mp = this.player.stats.maxMp;
        } else if (tile === 4) { // Shop
            this.shop.show();
        }
    }

    updateCamera() {
        // Center camera on player
        this.cameraX = this.player.pixelX - (this.game.width / 2) + 8;
        this.cameraY = this.player.pixelY - (this.game.height / 2) + 8;

        // Clamp camera to map bounds
        const mapPixelWidth = this.map[0].length * 16;
        const mapPixelHeight = this.map.length * 16;

        // Ensure camera doesn't go out of bounds (only if map is larger than screen)
        if (mapPixelWidth > this.game.width) {
            this.cameraX = Math.max(0, Math.min(this.cameraX, mapPixelWidth - this.game.width));
        } else {
            this.cameraX = -(this.game.width - mapPixelWidth) / 2; // Center if smaller
        }

        if (mapPixelHeight > this.game.height) {
            this.cameraY = Math.max(0, Math.min(this.cameraY, mapPixelHeight - this.game.height));
        } else {
            this.cameraY = -(this.game.height - mapPixelHeight) / 2;
        }
    }

    isSolid(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return true;
        }
        const tile = this.map[y][x];
        // Water(1), Mountain(2) are solid
        return tile === 1 || tile === 2;
    }

    draw(ctx) {
        const sprites = this.game.assets.getImage('sprites');

        // Calculate visible range
        const startCol = Math.floor(Math.max(0, this.cameraX) / 16);
        const endCol = startCol + (this.game.width / 16) + 1;
        const startRow = Math.floor(Math.max(0, this.cameraY) / 16);
        const endRow = startRow + (this.game.height / 16) + 1;

        const offsetX = -this.cameraX;
        const offsetY = -this.cameraY;

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y >= 0 && y < this.map.length && x >= 0 && x < this.map[0].length) {
                    const tileId = this.map[y][x];
                    this.drawTile(ctx, sprites, tileId, Math.round(x * 16 + offsetX), Math.round(y * 16 + offsetY));
                }
            }
        }

        // Draw player with offset
        ctx.save();
        ctx.translate(Math.round(offsetX), Math.round(offsetY));
        this.player.draw(ctx);
        ctx.restore();

        // Draw UI
        this.ui.draw(ctx);
        this.shop.draw(ctx);
    }

    drawTile(ctx, sprites, tileId, dx, dy) {
        // Row 3: Grass(0), Water(1), Mountain(2), Forest(3)
        // Row 4: Castle(4), Town(5)...

        let sx = 0;
        let sy = 32; // Row 3 start (16 * 2)

        if (tileId <= 3) {
            sx = tileId * 16;
            sy = 32;
        } else if (tileId === 9) { // King
            sx = 0; sy = 16; // Use hero sprite for now as placeholder
        } else if (tileId === 6) { // Inn
            sx = 16; sy = 48; // Town sprite
        } else {
            sx = (tileId - 4) * 16;
            sy = 48; // Row 4 (16 * 3)
        }

        ctx.drawImage(sprites, sx, sy, 16, 16, dx, dy, 16, 16);
    }
}
