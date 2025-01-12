import { Query, Scene, Vector, GlobalContext } from '@engine/core';
import { SpriteMash } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { AssetsLoader } from '@engine/loaders';
import {
  Character,
  CharacterDropEvent,
  CharacterGrabEvent,
  Tag,
  BOARD_DATA,
  Wall,
} from '@game/entities';
import { TickEvent } from '@engine/renderer';

type AssetPaths = Record<string, string>;

export default class GameLevelScene extends Scene {
  constructor(assetPaths: AssetPaths) {
    super();

    this.run(assetPaths);
  }

  private async run(assetPaths: AssetPaths) {
    const assetsLoader = new AssetsLoader();
    await assetsLoader.init(assetPaths);

    GlobalContext.set('assets', assetsLoader.assets);

    function makeEdgeWall(position: Vector, size: Vector) {
      const body = new StaticBody(position);
      body.addChild(new Wall(position, size));

      return body;
    }

    function makePlatformWall(position: Vector, size: Vector) {
      const body = new StaticBody(position);
      body.addChild(new Wall(position, size));

      body.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Character && dropping) {
          return false;
        }

        if (collider instanceof Character && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return body;
    }

    function makeTagTile(position: Vector, text: string) {
      const tag = new Tag(position, text);

      tag.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Character && dropping) {
          return false;
        }

        if (collider instanceof Character && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return tag;
    }

    let dropping = false;
    let grabbedTag: Tag | undefined;

    const board = SpriteMash.fromData(BOARD_DATA);
    this.addChild(board);
    this.addChild(makeEdgeWall(new Vector(0, 0), new Vector(32, 32 * 12)));
    this.addChild(
      makeEdgeWall(new Vector(32 * 15, 0), new Vector(32, 32 * 12))
    );
    this.addChild(makeEdgeWall(new Vector(32, 0), new Vector(32 * 14, 32)));
    this.addChild(
      makeEdgeWall(new Vector(32, 32 * 11), new Vector(32 * 14, 32))
    );
    this.addChild(
      makeEdgeWall(new Vector(32 * 11, 32 * 9), new Vector(32 * 4, 32 * 2))
    );

    for (let i = 6; i <= 10; i += 1) {
      this.addChild(
        makePlatformWall(new Vector(32 * 1, 2 + 32 * i), new Vector(32 * 9, 1))
      );
    }

    this.addChild(
      makePlatformWall(new Vector(32 * 10 + 24, 2 + 32 * 8), new Vector(22, 1))
    );

    this.addChild(
      makePlatformWall(new Vector(32 * 13 + 24, 2 + 32 * 7), new Vector(22, 1))
    );

    this.addChild(
      makePlatformWall(new Vector(32 * 6 + 24, 2 + 32 * 4), new Vector(22, 1))
    );

    const captain = new Character(new Vector(32 * 3, 32 * 2));
    this.addChild(captain);

    this.addChild(makeTagTile(new Vector(50, 32), '<em>'));
    this.addChild(makeTagTile(new Vector(130, 32), '</em>'));
    this.addChild(makeTagTile(new Vector(180, 32), 'text'));

    this.on(CharacterDropEvent, event => {
      dropping = event.start;
    });

    this.on(CharacterGrabEvent, () => {
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

      Query.childrenByType(Tag, this).forEach(tag => tag.wakeUp());
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
          // TODO: WIN!
        }
      }
    });
  }
}
