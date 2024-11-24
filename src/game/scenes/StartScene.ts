import { Scene, Vector } from '@engine/core';
import { Sprite, AnimatedSprite } from '@engine/elements';
import { Aseprite } from '@engine/loaders';

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

    const captainAseprite = await Aseprite.load(
      '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite'
    );
    captainAseprite.ignoreLayers(['Grid']);

    const terrain = await islandAseprite.getTilemap('Terrain');
    this.addChild(new Sprite(terrain.get(27), new Vector(0, 0)));

    this.addChild(
      new AnimatedSprite(
        await captainAseprite.getAnimation('Run S'),
        new Vector(0, 32)
      )
    );
  }
}
