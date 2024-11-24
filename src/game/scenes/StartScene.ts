import { Scene, Vector } from '@engine/core';
import { Sprite } from '@engine/elements';
import { Aseprite } from '@engine/loaders';
import { Captain } from '@game/entities';

export default class StartScene extends Scene {
  constructor() {
    super();

    this.init();
  }

  private async init() {
    const islandAseprite = await Aseprite.load(
      '/sprites/Treasure Hunters/Palm Tree Island/Aseprite/Palm Tree Island (ArtBoard).aseprite'
    );
    islandAseprite.ignoreLayers(['Grid']);

    const terrain = await islandAseprite.getTilemap('Terrain');
    this.addChild(new Sprite(terrain.get(27), new Vector(0, 0)));

    this.addChild(
      new Captain(new Vector(0, 32))
    );

    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 30; j++) {
        this.addChild(
          new Captain(new Vector(i, j + 32))
        );
      }
    }
  }
}
