import { Query, Scene, Vector } from '@engine/core';
import { Sprite } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { Captain, Tag } from '@game/entities';
import { Assets } from '@game';
import {
  CaptainDropEvent,
  CaptainGrabEvent,
} from 'game/entities/CharacterController';
import { TickEvent } from '@engine/renderer';

export default class BasicLevelScene extends Scene {
  constructor() {
    super();

    let dropping = false;
    let grabbedTag: Tag | undefined;

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

      body.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Captain && dropping) {
          return false;
        }

        if (collider instanceof Captain && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return body;
    }

    function makeTagTile(position: Vector, text: string) {
      const tag = new Tag(position, text);

      tag.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Captain && dropping) {
          return false;
        }

        if (collider instanceof Captain && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return tag;
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

    const captain = new Captain(new Vector(32 * 3, 32 * 2));
    this.addChild(captain);

    // this.addChild(makeTagTile(new Vector(180, 32), '<em>'));
    // this.addChild(makeTagTile(new Vector(130, 32), '</em>'));
    // this.addChild(makeTagTile(new Vector(160, 32), 'text'));

    this.on(CaptainDropEvent, event => {
      dropping = event.start;
    });

    this.on(CaptainGrabEvent, () => {
      if (grabbedTag) {
        grabbedTag = undefined;
      } else {
        const tag = captain.checkFutureIntersection(
          new Vector(0, 1),
          collider => collider instanceof Tag
        );
        if (tag) {
          grabbedTag = tag as Tag;
        }
      }
    });

    this.on(TickEvent, () => {
      if (grabbedTag) {
        grabbedTag.position = captain.position.add(new Vector(10, 18));
      } else {
        const tags = Query.childrenByType(Tag, this);
        tags.sort((a, b) => {
          if (a.position.y > b.position.y) {
            return 1;
          } else if (a.position.y < b.position.y) {
            return -1;
          }

          if (a.position.x > b.position.x) {
            return 1;
          } else if (a.position.x < b.position.x) {
            return -1;
          }

          return 0;
        });

        const html = tags.map(tag => tag.text).join(' ');
        if (html === '<em> text </em>') {
          console.log('win');
        }
      }
    });
  }
}