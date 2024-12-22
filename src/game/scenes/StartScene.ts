import { Scene, Vector } from '@engine/core';
import { Sprite } from '@engine/elements';
import { Aseprite } from '@engine/loaders';
import { Captain } from '@game/entities';
import { PhysicsBody } from '@engine/physics';

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

    function makeTerrainTile(position: Vector) {
      const terrainBody = new PhysicsBody(position);
      terrainBody.addChild(new Sprite(terrain.get(27)));
      return terrainBody;
    }

    this.addChild(makeTerrainTile(new Vector(0, 128)));
    this.addChild(makeTerrainTile(new Vector(32, 128)));
    this.addChild(makeTerrainTile(new Vector(64, 128)));
    this.addChild(makeTerrainTile(new Vector(96, 128)));
    this.addChild(makeTerrainTile(new Vector(128, 128)));
    this.addChild(makeTerrainTile(new Vector(160, 128)));
    this.addChild(makeTerrainTile(new Vector(192, 128)));
    this.addChild(makeTerrainTile(new Vector(224, 128)));
    this.addChild(makeTerrainTile(new Vector(64, 96)));
    this.addChild(makeTerrainTile(new Vector(32, 64)));

    // const terrainDynBody = new PhysicsBody(new Vector(55, 0), true);
    // terrainDynBody.addChild(new Sprite(terrain.get(27)));
    // this.addChild(terrainDynBody);

    this.addChild(new Captain(new Vector(32, 0)));

    // for (let i = 0; i < 100; i++) {
    //   for (let j = 0; j < 100; j++) {
    //     this.addChild(
    //       new Captain(new Vector(i, j + 32))
    //     );
    //   }
    // }
  }
}
