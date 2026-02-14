export class InputHandler {
    constructor() {
        this.keys = {};
        this.downKeys = {}; // Keys pressed on this frame

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.downKeys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            delete this.downKeys[e.code];
        });
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isPressed(code) {
        if (this.downKeys[code]) {
            delete this.downKeys[code]; // Consume the press
            return true;
        }
        return false;
    }
}
