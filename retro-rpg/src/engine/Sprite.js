export class Sprite {
    constructor({ image, x, y, width, height, scale = 1 }) {
        this.image = image;
        this.sx = x; // Source X
        this.sy = y; // Source Y
        this.width = width;
        this.height = height;
        this.scale = scale;
    }

    draw(ctx, dx, dy) {
        ctx.drawImage(
            this.image,
            this.sx, this.sy,
            this.width, this.height,
            dx, dy,
            this.width * this.scale, this.height * this.scale
        );
    }
}
