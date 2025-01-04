import { Scene } from '@engine/core';
import Assets from './Assets';
import { StartScene } from './scenes';

export default class Game {
  public scenes: Record<string, Scene> = {};

  public assets = new Assets();

  async init() {
    await this.assets.init();
    this.scenes['Start'] = new StartScene();
  }
}
