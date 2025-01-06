import { Scene } from '@engine/core';
import { AssetsLoader, AssetsMap } from '@engine/loaders';
import { BasicLevelScene } from './scenes';

export default class Game {
  public scenes: Record<string, Scene> = {};
  public static assets: AssetsMap = {};

  async init(assetPaths: Record<string, string>) {
    const assetsLoader = new AssetsLoader();
    await assetsLoader.init(assetPaths);

    Game.assets = assetsLoader.assets;

    this.scenes['Basic Level'] = new BasicLevelScene();
  }
}
