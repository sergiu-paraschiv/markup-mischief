export interface Sprite {
    path?: string
    x: number
    y: number
}

export function makeSpriteMap(
    spritePath: string | undefined,
    width: number,
    height: number
) {
    const tiles: Sprite[][] = [];
    for (let j = 0; j < height; j += 1) {
        const row: Sprite[] = [];

        for (let i = 0; i < width; i += 1) {
            row.push({
                path: spritePath,
                x: i,
                y: j
            });
        }

        tiles.push(row);
    }

    return tiles;
}