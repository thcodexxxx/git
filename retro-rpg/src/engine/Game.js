import { AssetLoader } from './AssetLoader.js';
import { InputHandler } from './InputHandler.js';
import { TitleScene } from '../game/scenes/TitleScene.js';
import { Player } from '../game/Player.js';
import { SpriteGenerator } from './SpriteGenerator.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;

        // Game settings
        this.width = canvas.width;
        this.height = canvas.height;

        // Systems
        this.assets = new AssetLoader();
        this.input = new InputHandler();

        // Global Game State
        this.player = new Player(this);

        this.currentScene = null;

        // Bind loop
        this.loop = this.loop.bind(this);
    }

    async init() {
        console.log('Initializing Game...');
        try {
            // Generate sprites programmatically to ensure compatibility and no missing files
            console.log('Generating sprites...');
            const spriteDataUrl = SpriteGenerator.generate();
            await this.assets.loadImage('sprites', spriteDataUrl);
            console.log('Assets loaded from generator');

            this.changeScene(new TitleScene(this));
            this.start();
        } catch (e) {
            console.error('Failed to load assets', e);
        }
    }

    start() {
        console.log('Game Started');
        requestAnimationFrame(this.loop);
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.currentScene) {
            this.currentScene.draw(this.ctx);
        }
    }

    changeScene(scene) {
        if (this.currentScene) {
            this.currentScene.onExit();
        }
        this.currentScene = scene;
        this.currentScene.onEnter();
    }
}
