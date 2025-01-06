import { Scene } from '@engine/core';
import Assets from './Assets';
import { BasicLevelScene, SpriteMashEditorScene } from './scenes';

export default class Game {
  public scenes: Record<string, Scene> = {};

  public assets = new Assets();

  async init() {
    await this.assets.init();
    this.scenes['Basic Level'] = new BasicLevelScene();
    this.scenes['Sprite Mash Editor'] = new SpriteMashEditorScene();
  }
}
