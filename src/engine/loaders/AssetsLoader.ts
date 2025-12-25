import { Aseprite, TileMap, Texture } from '@engine/loaders';
import { Animation } from '@engine/elements';

export type AssetsInfo = Record<string, string>;
export type AssetsMap = Record<
  string,
  {
    animations: Record<string, Animation>;
    tilemaps: Record<string, TileMap>;
  }
>;

export type CharsInfo = Record<
  string,
  {
    path: string;
    map: Record<string, number>;
  }
>;
export type CharsMap = Record<string, Record<string, Texture | undefined>>;

export enum Char {
  UNKNOWN = '__unknown__',
}

export default class AssetsLoader {
  public assets: AssetsMap = {};
  public chars: CharsMap = {};

  async init(assetsInfo: AssetsInfo, charsInfo?: CharsInfo) {
    for (const fileName in assetsInfo) {
      const filePath = assetsInfo[fileName];

      const aseprite = await Aseprite.load(filePath);
      aseprite.ignoreLayers(['Grid']);

      this.assets[fileName] = {
        tilemaps: {},
        animations: {},
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

    if (charsInfo) {
      for (const fileName in charsInfo) {
        const filePath = charsInfo[fileName].path;

        const aseprite = await Aseprite.load(filePath);
        aseprite.ignoreLayers(['Grid']);

        const tilemap = await aseprite.getTilemap(fileName);

        this.chars[fileName] = {};
        for (const charKey in charsInfo[fileName].map) {
          this.chars[fileName][charKey] = tilemap.get(
            charsInfo[fileName].map[charKey]
          );
        }

        this.chars[fileName][Char.UNKNOWN] = tilemap.get(
          charsInfo[fileName].map[Char.UNKNOWN]
        );
      }
    }
  }
}
