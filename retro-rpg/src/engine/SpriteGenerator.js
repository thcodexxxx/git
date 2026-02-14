export class SpriteGenerator {
    static generate() {
        const itemSize = 16;
        const cols = 10;
        const rows = 10;
        const canvas = document.createElement('canvas');
        canvas.width = cols * itemSize;
        canvas.height = rows * itemSize;
        const ctx = canvas.getContext('2d');

        // Clear transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Palette
        const C = {
            t: 'rgba(0,0,0,0)', // Transparent
            b: '#000000', // Black (Outline)
            w: '#ffffff', // White
            skin: '#ffcc99', // Skin
            hair: '#663300', // Brown Hair
            r: '#cc0000', // Red
            r_d: '#880000', // Dark Red
            g: '#00cc00', // Green
            g_l: '#66ff66', // Light Green
            g_d: '#006600', // Dark Green
            bl: '#0066cc', // Blue
            bl_l: '#66ccff', // Light Blue
            bl_d: '#003366', // Dark Blue
            gy: '#aaaaaa', // Gray
            gy_l: '#cccccc', // Light Gray
            gy_d: '#666666', // Dark Gray
            br: '#cc9966', // Brown (Ground)
            br_d: '#8b4513', // Dark Brown (Wood/Rock)
            gd: '#ffd700', // Gold
        };

        const drawSprite = (ox, oy, pixels) => {
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const colorCode = pixels[y][x];
                    if (colorCode && C[colorCode]) {
                        ctx.fillStyle = C[colorCode];
                        ctx.fillRect(ox + x, oy + y, 1, 1);
                    }
                }
            }
        };

        // --- Row 0: Hero (Warrior) ---
        // Down
        const heroDown = [
            ['t', 't', 't', 't', 'b', 'b', 'b', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't'], // Helmet base
            ['t', 't', 't', 'b', 'g_d', 'g_d', 'b', 'b', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't'], // Helmet horns
            ['t', 't', 't', 'b', 'skin', 'skin', 'skin', 'skin', 'skin', 'skin', 'b', 't', 't', 't', 't', 't'], // Face
            ['t', 't', 't', 'b', 'skin', 'b', 'skin', 'skin', 'b', 'skin', 'b', 't', 't', 't', 't', 't'], // Eyes
            ['t', 't', 't', 'b', 'skin', 'skin', 'skin', 'skin', 'skin', 'skin', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't', 't'], // Armor shoulders
            ['t', 'b', 'bl_d', 'bl', 'w', 'w', 'w', 'w', 'w', 'w', 'bl', 'bl_d', 'b', 't', 't', 't'], // Armor chest (white cross?)
            ['t', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't'], // Armor body
            ['t', 't', 'b', 'bl_d', 'bl', 'bl', 'gd', 'gd', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't', 't'], // Belt
            ['t', 't', 't', 'b', 'gy', 'gy', 'b', 'b', 'gy', 'gy', 'b', 't', 't', 't', 't', 't'], // Legs (Chainmail)
            ['t', 't', 't', 'b', 'gy', 'gy', 'b', 'b', 'gy', 'gy', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'r_d', 'r', 'b', 'b', 'r', 'r_d', 'b', 't', 't', 't', 't', 't'], // Boots
            ['t', 't', 't', 'b', 'r_d', 'r', 'b', 'b', 'r', 'r_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'b', 't', 't', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(0, 0, heroDown);

        // Up (Back)
        const heroUp = [
            ['t', 't', 't', 't', 'b', 'b', 'b', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'g_d', 'g_d', 'b', 'b', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'b', 't', 't', 't', 't', 't'], // Helmet back / neck
            ['t', 't', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't', 't'],
            ['t', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't'],
            ['t', 'b', 'bl_d', 'bl', 'bl', 'w', 'w', 'w', 'w', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't'], // Cape? or Armor back
            ['t', 't', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't', 't'],
            ['t', 't', 'b', 'bl', 'bl', 'gd', 'gd', 'gd', 'gd', 'bl', 'bl', 'b', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'bl', 'bl', 'b', 'b', 'bl', 'bl', 'b', 't', 't', 't', 't', 't'], // Skirt/Legs
            ['t', 't', 't', 'b', 'gy', 'gy', 'b', 'b', 'gy', 'gy', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'r_d', 'r', 'b', 'b', 'r', 'r_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'b', 't', 't', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(16, 0, heroUp);

        // Left (Side) - w/ Shield
        const heroLeft = [
            ['t', 't', 't', 't', 't', 'b', 'b', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'g_d', 'g_d', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'g_d', 'b', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'skin', 'skin', 'skin', 'skin', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'b', 'skin', 'skin', 'b', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 'b', 'w', 'w', 'w', 'b', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't'], // Shield
            ['t', 't', 'b', 'w', 'b', 'w', 'b', 'bl', 'bl', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 'b', 'w', 'w', 'w', 'b', 'bl', 'bl', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 'b', 'w', 'b', 'w', 'b', 'bl', 'bl', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'b', 'b', 'b', 'bl', 'bl', 'bl', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'gy', 'gy', 'gy', 'b', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'b', 'r', 'r', 'r', 'b', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(32, 0, heroLeft);

        // Right (Same as left, flipped logic or just explicitly drawn if not flipping)
        const heroRight = [
            ['t', 't', 't', 't', 't', 'b', 'b', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'g_d', 'g_d', 'g_d', 'g_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'g_d', 'g_d', 'b', 'g_d', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'skin', 'skin', 'skin', 'skin', 'b', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'skin', 'skin', 'b', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'b', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'b', 'b', 'b', 'w', 'w', 'w', 'b', 't', 't', 't'], // Shield
            ['t', 't', 't', 't', 't', 'b', 'bl', 'bl', 'b', 'w', 'b', 'w', 'b', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'bl', 'bl', 'b', 'w', 'w', 'w', 'b', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'bl', 'bl', 'b', 'w', 'b', 'w', 'b', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'bl', 'bl', 'bl', 'b', 'b', 'b', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'gy', 'gy', 'gy', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'b', 'r', 'r', 'r', 'b', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 'b', 'b', 'b', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(48, 0, heroRight);


        // --- Row 1: NPCs ---
        // King (0, 16)
        const king = [
            ['t', 't', 't', 't', 't', 'gd', 'gd', 'gd', 'gd', 'gd', 'gd', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'gd', 'r', 'r', 'gd', 'gd', 'r', 'r', 'gd', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'gd', 'r', 'r', 'gd', 'gd', 'r', 'r', 'gd', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'skin', 'skin', 'skin', 'skin', 'skin', 'skin', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'skin', 'b', 'skin', 'skin', 'b', 'skin', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'w', 'w', 'w', 'w', 'w', 'w', 't', 't', 't', 't', 't'], // Beard
            ['t', 't', 't', 't', 'r', 'r', 'w', 'w', 'w', 'w', 'r', 'r', 't', 't', 't', 't'],
            ['t', 't', 't', 'r', 'r_d', 'r', 'r', 'r', 'r', 'r', 'r', 'r_d', 'r', 't', 't', 't'],
            ['t', 't', 'r', 'r_d', 'r', 'gap', 'gd', 'gd', 'gd', 'gd', 'gap', 'r', 'r_d', 'r', 't', 't'],
            ['t', 't', 'r', 'r_d', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r_d', 'r', 't', 't'],
            ['t', 't', 'r', 'r_d', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r_d', 'r', 't', 't'],
            ['t', 't', 'r', 'r_d', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r_d', 'r', 't', 't'],
            ['t', 't', 't', 't', 't', 'gd', 'gd', 't', 't', 'gd', 'gd', 't', 't', 't', 't', 't'], // Shoes
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(0, 16, king);

        // --- Row 2: Map Tiles ---
        // 0: Grass (0, 32)
        const grass = [];
        for (let y = 0; y < 16; y++) {
            let row = [];
            for (let x = 0; x < 16; x++) {
                // Checkered/Noise pattern
                if ((x + y) % 2 === 0) row.push('g_l');
                else if (Math.random() > 0.8) row.push('g_d');
                else row.push('g');
            }
            grass.push(row);
        }
        // Add some grass tufts
        grass[4][4] = 'g_d'; grass[3][5] = 'g_d'; grass[4][6] = 'g_d';
        grass[10][12] = 'g_d'; grass[9][11] = 'g_d';
        drawSprite(0, 32, grass);

        // 1: Water (16, 32)
        const water = [];
        for (let y = 0; y < 16; y++) {
            let row = [];
            for (let x = 0; x < 16; x++) {
                row.push('bl');
            }
            water.push(row);
        }
        // Waves
        water[2][3] = 'w'; water[2][4] = 'w'; water[2][5] = 'w';
        water[6][10] = 'w'; water[6][11] = 'w';
        water[12][2] = 'w'; water[12][3] = 'w';
        drawSprite(16, 32, water);

        // 2: Mountain (32, 32)
        const mountain = [
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br_d', 'br_d', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br_d', 'gy_d', 'gy_d', 'br_d', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br_d', 'gy_d', 'gy', 'gy', 'gy_d', 'br_d', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br_d', 'gy_d', 'gy', 'gy', 'gy_d', 'br_d', 'br_d', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br_d', 'gy_d', 'gy', 'gy', 'gy_d', 'gy_d', 'gy', 'br_d', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br_d', 'gy_d', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy_d', 'br_d', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br_d', 'gy_d', 'gy_d', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy_d', 'br_d', 'br', 'br', 'br', 'br'],
            ['br', 'br_d', 'gy_d', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy_d', 'gy_d', 'br_d', 'br', 'br', 'br'],
            ['br_d', 'gy_d', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy_d', 'br_d', 'br', 'br'],
            ['br_d', 'gy_d', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy', 'gy_d', 'br_d', 'br', 'br'],
            ['br_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'gy_d', 'br_d', 'br', 'br'],
            ['br', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
        ];
        drawSprite(32, 32, mountain);

        // 3: Forest (48, 32)
        const forest = [
            ['g', 'g', 'g', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g_d', 'g', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g', 'g', 'g'],
            ['g', 'g_d', 'g', 'g', 'g_d', 'g_d', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g_d', 'g', 'g', 'g'],
            ['g', 'g_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g', 'g'],
            ['g_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g'],
            ['g_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g'],
            ['g_d', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g_d', 'g', 'g'],
            ['g_d', 'g', 'g', 'g_d', 'g_d', 'br_d', 'br_d', 'br_d', 'br_d', 'g_d', 'g', 'g', 'g', 'g_d', 'g', 'g'],
            ['g', 'g_d', 'g', 'g_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'g_d', 'g', 'g_d', 'g', 'g', 'g'],
            ['g', 'g', 'g_d', 'g_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'g_d', 'g', 'g_d', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'br_d', 'br_d', 'br_d', 'br_d', 'g', 'g', 'g_d', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'br_d', 'br_d', 'br_d', 'br_d', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
            ['g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g'],
        ];
        drawSprite(48, 32, forest);

        // --- Row 3: Structures ---
        // 4: Castle Icon (0, 48) - Simplified world map castle
        const castle = [
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 'br', 't', 't', 't', 't', 't', 't', 't', 't', 't', 'br', 't', 't', 't'],
            ['t', 'br', 'br', 'br', 't', 't', 't', 'br', 't', 't', 't', 'br', 'br', 'br', 't'],
            ['t', 'w', 'w', 'w', 't', 't', 'w', 'w', 'w', 't', 't', 'w', 'w', 'w', 't'],
            ['t', 'w', 'b', 'w', 't', 't', 'w', 'b', 'w', 't', 't', 'w', 'b', 'w', 't'],
            ['t', 'w', 'w', 'w', 't', 't', 'w', 'w', 'w', 't', 't', 'w', 'w', 'w', 't'],
            ['t', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 't'],
            ['t', 'w', 'b', 'w', 'w', 'b', 'w', 'b', 'w', 'b', 'w', 'w', 'b', 'w', 't'],
            ['t', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 't'],
            ['br', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'br'],
            ['br', 'w', 'w', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'br_d', 'w', 'w', 'br'],
            ['br', 'w', 'w', 'br_d', 'b', 'b', 'b', 'b', 'b', 'b', 'br_d', 'w', 'w', 'br'],
            ['br', 'w', 'w', 'br_d', 'b', 'b', 'b', 'b', 'b', 'b', 'br_d', 'w', 'w', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(0, 48, castle);

        // 5: Town Icon (16, 48)
        const town = [
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 'br', 'br', 'br', 't', 't', 't', 't'],
            ['t', 't', 'br', 'br', 'br', 't', 't', 't', 'br', 'w', 'w', 'w', 'br', 't', 't', 't'],
            ['t', 'br', 'w', 'w', 'w', 'br', 't', 't', 'w', 'w', 'b', 'w', 'w', 't', 't', 't'],
            ['t', 'w', 'w', 'b', 'w', 'w', 't', 't', 'w', 'w', 'w', 'w', 'w', 't', 't', 't'],
            ['t', 'w', 'w', 'w', 'w', 'w', 't', 't', 'w', 'b', 'b', 'b', 'w', 't', 't', 't'],
            ['t', 'w', 'w', 'b', 'w', 'w', 't', 't', 'w', 'b', 'b', 'b', 'w', 't', 't', 't'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br', 'br'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(16, 48, town);


        // --- Row 5: Enemies ---
        // Slime (0, 80)
        const slime = [
            ['t', 't', 't', 't', 't', 't', 't', 'bl_d', 'bl_d', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 'bl_d', 'bl', 'bl', 'bl', 'bl_d', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't', 't', 't', 't'],
            ['t', 't', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't', 't', 't'],
            ['t', 'bl_d', 'bl', 'bl', 'bl', 'w', 'b', 'bl', 'bl', 'w', 'b', 'bl', 'bl', 'bl_d', 't', 't'],
            ['t', 'bl_d', 'bl', 'bl', 'bl', 'b', 'b', 'bl', 'bl', 'b', 'b', 'bl', 'bl', 'bl_d', 't', 't'],
            ['bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'r', 'r', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't'],
            ['bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'r', 'r', 'r', 'r', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't'],
            ['bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't'],
            ['t', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 't', 't'],
            ['t', 't', 'bl_d', 'bl_d', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl_d', 'bl_d', 't', 't', 't'],
            ['t', 't', 't', 't', 'bl_d', 'bl_d', 'bl_d', 'bl_d', 'bl_d', 'bl_d', 'bl_d', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
            ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't'],
        ];
        drawSprite(0, 80, slime);


        return canvas.toDataURL('image/png');
    }
}
