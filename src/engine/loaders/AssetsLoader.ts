import { Aseprite, TileMap, Texture } from '@engine/loaders';
import { Animation } from '@engine/elements';

export type AssetsMap = Record<
  string,
  {
    animations: Record<string, Animation>;
    tilemaps: Record<string, TileMap>;
    charmaps: Record<string, Record<string, Texture | undefined>>;
  }
>;

export default class AssetsLoader {
  public assets: AssetsMap = {};

  async init(assetPaths: Record<string, string>) {
    for (const fileName in assetPaths) {
      const filePath = assetPaths[fileName];

      const aseprite = await Aseprite.load(filePath);
      aseprite.ignoreLayers(['Grid']);

      this.assets[fileName] = {
        tilemaps: {},
        animations: {},
        charmaps: {},
      };

      for (const tilemapName of aseprite.getTilemapNames()) {
        this.assets[fileName].tilemaps[tilemapName] =
          await aseprite.getTilemap(tilemapName);
      }

      for (const animationName of aseprite.getAnimationNames()) {
        this.assets[fileName].animations[animationName] =
          await aseprite.getAnimation(animationName);
      }
    }

    this.assets['Chars'].charmaps['Chars'] = {
      a: this.assets['Chars'].tilemaps['Chars'].get(1),
      b: this.assets['Chars'].tilemaps['Chars'].get(2),
      c: this.assets['Chars'].tilemaps['Chars'].get(3),
      d: this.assets['Chars'].tilemaps['Chars'].get(4),
      e: this.assets['Chars'].tilemaps['Chars'].get(5),
      f: this.assets['Chars'].tilemaps['Chars'].get(6),
      g: this.assets['Chars'].tilemaps['Chars'].get(7),
      h: this.assets['Chars'].tilemaps['Chars'].get(8),
      i: this.assets['Chars'].tilemaps['Chars'].get(9),
      j: this.assets['Chars'].tilemaps['Chars'].get(10),
      k: this.assets['Chars'].tilemaps['Chars'].get(11),
      l: this.assets['Chars'].tilemaps['Chars'].get(12),
      m: this.assets['Chars'].tilemaps['Chars'].get(13),
      n: this.assets['Chars'].tilemaps['Chars'].get(14),
      o: this.assets['Chars'].tilemaps['Chars'].get(15),
      p: this.assets['Chars'].tilemaps['Chars'].get(16),
      q: this.assets['Chars'].tilemaps['Chars'].get(17),
      r: this.assets['Chars'].tilemaps['Chars'].get(18),
      s: this.assets['Chars'].tilemaps['Chars'].get(19),
      t: this.assets['Chars'].tilemaps['Chars'].get(20),
      u: this.assets['Chars'].tilemaps['Chars'].get(21),
      v: this.assets['Chars'].tilemaps['Chars'].get(22),
      w: this.assets['Chars'].tilemaps['Chars'].get(23),
      x: this.assets['Chars'].tilemaps['Chars'].get(24),
      y: this.assets['Chars'].tilemaps['Chars'].get(25),
      z: this.assets['Chars'].tilemaps['Chars'].get(26),
      '/': this.assets['Chars'].tilemaps['Chars'].get(40),
      '<': this.assets['Chars'].tilemaps['Chars'].get(85),
      '>': this.assets['Chars'].tilemaps['Chars'].get(86),
    };
  }
}
