import { Aseprite, AsepriteTileMap, Texture } from '@engine/loaders';
import { Animation } from '@engine/elements';

export default class Assets {
  public static aseprite: Record<string, Aseprite> = {};
  public static tilemap: Record<string, AsepriteTileMap> = {};
  public static charmap: Record<string, Record<string, Texture | undefined>> =
    {};
  public static animation: Record<string, Animation> = {};

  async init() {
    Assets.aseprite['Palm Tree Island'] = await Aseprite.load(
      '/sprites/Treasure Hunters/Palm Tree Island/Aseprite/Palm Tree Island (ArtBoard).aseprite'
    );
    Assets.aseprite['Palm Tree Island'].ignoreLayers(['Grid']);

    Assets.aseprite['Pirate Ship'] = await Aseprite.load(
      '/sprites/Treasure Hunters/Pirate Ship/Aseprite/TileSets.aseprite'
    );
    Assets.aseprite['Pirate Ship'].ignoreLayers(['Grid']);

    Assets.aseprite['Wood and Paper'] = await Aseprite.load(
      '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Wood and Paper.aseprite'
    );
    Assets.aseprite['Wood and Paper'].ignoreLayers(['Grid']);

    Assets.aseprite['Chars'] = await Aseprite.load(
      '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Chars.aseprite'
    );
    Assets.aseprite['Chars'].ignoreLayers(['Grid']);

    Assets.aseprite['Captain Clown Nose'] = await Aseprite.load(
      '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite'
    );
    Assets.aseprite['Captain Clown Nose'].ignoreLayers(['Grid']);

    Assets.tilemap['Palm Tree Island Terrain'] =
      await Assets.aseprite['Palm Tree Island'].getTilemap('Terrain');

    Assets.tilemap['Pirate Ship Platforms'] =
      await Assets.aseprite['Pirate Ship'].getTilemap('Platforms');

    Assets.animation['Captain Clown Nose Idle'] =
      await Assets.aseprite['Captain Clown Nose'].getAnimation('Idle');

    Assets.animation['Captain Clown Nose Jump'] =
      await Assets.aseprite['Captain Clown Nose'].getAnimation('Jump');

    Assets.animation['Captain Clown Nose Fall'] =
      await Assets.aseprite['Captain Clown Nose'].getAnimation('Fall');

    Assets.animation['Captain Clown Nose Ground'] =
      await Assets.aseprite['Captain Clown Nose'].getAnimation('Ground');

    Assets.animation['Captain Clown Nose Run'] =
      await Assets.aseprite['Captain Clown Nose'].getAnimation('Run');

    Assets.tilemap['Wood and Paper'] =
      await Assets.aseprite['Wood and Paper'].getTilemap('Wood and Paper');

    Assets.tilemap['Chars'] =
      await Assets.aseprite['Chars'].getTilemap('Chars');

    Assets.charmap['Chars'] = {
      a: Assets.tilemap['Chars'].get(1),
      b: Assets.tilemap['Chars'].get(2),
      c: Assets.tilemap['Chars'].get(3),
      d: Assets.tilemap['Chars'].get(4),
      e: Assets.tilemap['Chars'].get(5),
      f: Assets.tilemap['Chars'].get(6),
      g: Assets.tilemap['Chars'].get(7),
      h: Assets.tilemap['Chars'].get(8),
      i: Assets.tilemap['Chars'].get(9),
      j: Assets.tilemap['Chars'].get(10),
      k: Assets.tilemap['Chars'].get(11),
      l: Assets.tilemap['Chars'].get(12),
      m: Assets.tilemap['Chars'].get(13),
      n: Assets.tilemap['Chars'].get(14),
      o: Assets.tilemap['Chars'].get(15),
      p: Assets.tilemap['Chars'].get(16),
      q: Assets.tilemap['Chars'].get(17),
      r: Assets.tilemap['Chars'].get(18),
      s: Assets.tilemap['Chars'].get(19),
      t: Assets.tilemap['Chars'].get(20),
      u: Assets.tilemap['Chars'].get(21),
      v: Assets.tilemap['Chars'].get(22),
      w: Assets.tilemap['Chars'].get(23),
      x: Assets.tilemap['Chars'].get(24),
      y: Assets.tilemap['Chars'].get(25),
      z: Assets.tilemap['Chars'].get(26),
      '/': Assets.tilemap['Chars'].get(40),
      '<': Assets.tilemap['Chars'].get(85),
      '>': Assets.tilemap['Chars'].get(86),
    };
  }
}
