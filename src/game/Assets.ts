import { Aseprite, AsepriteTileMap, Texture } from '@engine/loaders';
import { Animation } from '@engine/elements';

export default class Assets {
  public static aseprite: Record<
    string,
    {
      animations: Record<string, Animation>;
      tilemaps: Record<string, AsepriteTileMap>;
    }
  > = {};
  public static charmap: Record<string, Record<string, Texture | undefined>> =
    {};

  async init() {
    const files: Record<string, string> = {
      'Palm Tree Island':
        '/sprites/Treasure Hunters/Palm Tree Island/Aseprite/Palm Tree Island (ArtBoard).aseprite',
      'Pirate Ship':
        '/sprites/Treasure Hunters/Pirate Ship/Aseprite/TileSets.aseprite',
      Paper:
        '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Paper.aseprite',
      Chars:
        '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Chars.aseprite',
      'Captain Clown Nose':
        '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite',
    };

    for (const fileName in files) {
      const filePath = files[fileName];

      const aseprite = await Aseprite.load(filePath);
      aseprite.ignoreLayers(['Grid']);

      Assets.aseprite[fileName] = {
        tilemaps: {},
        animations: {},
      };

      for (const tilemapName of aseprite.getTilemapNames()) {
        Assets.aseprite[fileName].tilemaps[tilemapName] =
          await aseprite.getTilemap(tilemapName);
      }

      for (const animationName of aseprite.getAnimationNames()) {
        Assets.aseprite[fileName].animations[animationName] =
          await aseprite.getAnimation(animationName);
      }
    }

    Assets.charmap['Chars'] = {
      a: Assets.aseprite['Chars'].tilemaps['Chars'].get(1),
      b: Assets.aseprite['Chars'].tilemaps['Chars'].get(2),
      c: Assets.aseprite['Chars'].tilemaps['Chars'].get(3),
      d: Assets.aseprite['Chars'].tilemaps['Chars'].get(4),
      e: Assets.aseprite['Chars'].tilemaps['Chars'].get(5),
      f: Assets.aseprite['Chars'].tilemaps['Chars'].get(6),
      g: Assets.aseprite['Chars'].tilemaps['Chars'].get(7),
      h: Assets.aseprite['Chars'].tilemaps['Chars'].get(8),
      i: Assets.aseprite['Chars'].tilemaps['Chars'].get(9),
      j: Assets.aseprite['Chars'].tilemaps['Chars'].get(10),
      k: Assets.aseprite['Chars'].tilemaps['Chars'].get(11),
      l: Assets.aseprite['Chars'].tilemaps['Chars'].get(12),
      m: Assets.aseprite['Chars'].tilemaps['Chars'].get(13),
      n: Assets.aseprite['Chars'].tilemaps['Chars'].get(14),
      o: Assets.aseprite['Chars'].tilemaps['Chars'].get(15),
      p: Assets.aseprite['Chars'].tilemaps['Chars'].get(16),
      q: Assets.aseprite['Chars'].tilemaps['Chars'].get(17),
      r: Assets.aseprite['Chars'].tilemaps['Chars'].get(18),
      s: Assets.aseprite['Chars'].tilemaps['Chars'].get(19),
      t: Assets.aseprite['Chars'].tilemaps['Chars'].get(20),
      u: Assets.aseprite['Chars'].tilemaps['Chars'].get(21),
      v: Assets.aseprite['Chars'].tilemaps['Chars'].get(22),
      w: Assets.aseprite['Chars'].tilemaps['Chars'].get(23),
      x: Assets.aseprite['Chars'].tilemaps['Chars'].get(24),
      y: Assets.aseprite['Chars'].tilemaps['Chars'].get(25),
      z: Assets.aseprite['Chars'].tilemaps['Chars'].get(26),
      '/': Assets.aseprite['Chars'].tilemaps['Chars'].get(40),
      '<': Assets.aseprite['Chars'].tilemaps['Chars'].get(85),
      '>': Assets.aseprite['Chars'].tilemaps['Chars'].get(86),
    };
  }
}
