import { Aseprite, AsepriteTileMap } from '@engine/loaders';
import { Animation } from '@engine/elements';

export default class Assets {
  public static aseprite: Record<string, Aseprite> = {};
  public static tilemap: Record<string, AsepriteTileMap> = {};
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
  }
}
