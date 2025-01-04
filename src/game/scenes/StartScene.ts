import { Scene, Vector } from '@engine/core';
import { Sprite } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { Captain } from '@game/entities';
import { Assets } from '@game';
import { CaptainDropEvent } from 'game/entities/CharacterController';

export default class StartScene extends Scene {
  constructor() {
    super();

    let dropping = false;

    function makeEdgeTile(position: Vector) {
      const body = new StaticBody(position);
      body.addChild(
        new Sprite(Assets.tilemap['Palm Tree Island Terrain'].get(27))
      );

      return body;
    }

    function makePlatformTile(position: Vector) {
      const body = new StaticBody(position);
      body.setColliderDimensions(new Vector(32, 2));
      body.addChild(
        new Sprite(Assets.tilemap['Pirate Ship Platforms'].get(52))
      );

      body.filterCollisionFn = velocity => {
        if (!dropping && velocity.y > 0) {
          return true;
        }
        return false;
      };

      return body;
    }

    for (let i = 0; i < 8; i += 1) {
      this.addChild(makeEdgeTile(new Vector(32 * i, 0)));
      this.addChild(makeEdgeTile(new Vector(32 * i, 32 * 5)));
    }

    for (let i = 1; i < 5; i += 1) {
      this.addChild(makeEdgeTile(new Vector(0, 32 * i)));
      this.addChild(makeEdgeTile(new Vector(32 * 7, 32 * i)));
    }

    this.addChild(makeEdgeTile(new Vector(32 * 3, 32 * 4)));

    this.addChild(makePlatformTile(new Vector(32 * 2, 32 * 4)));
    this.addChild(makePlatformTile(new Vector(32, 32 * 3)));

    this.addChild(new Captain(new Vector(35 * 3, 32)));

    // for (let j = 1; j < 7; j++) {
    //   this.addChild(new Captain(new Vector(j * 32, 32)));
    // }

    this.on(
      CaptainDropEvent,
      event => {
        dropping = event.start;
      },
      true
    );
  }
}
