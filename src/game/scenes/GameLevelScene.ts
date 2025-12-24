import { GlobalContext, Query, Scene, Vector } from '@engine/core';
import { SpriteMash, SpriteMashData, Sprite } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { AssetsLoader, Texture } from '@engine/loaders';
import {
  BOARD_DATA,
  PinkStar,
  Character,
  CharacterDropEvent,
  CharacterGrabEvent,
  Pointing,
  Tag,
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

    const board = SpriteMash.fromData(BOARD_DATA as SpriteMashData);
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

    const player = new PinkStar(new Vector(32 * 2, 32 * 2));
    this.addChild(player);
    // Add ghost at a higher depth so it renders on top of tags
    this.addChild(player.ghost, 1000);

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
        const tag = player.checkFutureIntersection(
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
        grabbedTag.position = player.position.add(
          new Vector(player.pointing === Pointing.LEFT ? 24 : 38, 8)
        );
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

      // Update ghost position to follow player
      player.updateGhostPosition();

      // Check if player is behind any tags
      const overlappingTags = player.checkAllCurrentIntersections(
        collider => collider instanceof Tag
      );

      if (overlappingTags.length > 0) {
        // Create texture masks from overlapping tags
        player.ghostGraphics.clipRegion = overlappingTags.map(tag => {
          const tagBox = tag.collider;

          // Render the tag to a texture
          const rendered = tag.renderToTexture(
            tagBox.dimensions.x,
            tagBox.dimensions.y
          );

          if (!rendered) {
            // Fallback to rectangle clip if rendering fails
            return {
              x: tagBox.position.x,
              y: tagBox.position.y,
              width: tagBox.dimensions.x,
              height: tagBox.dimensions.y,
            };
          }

          // Create texture from the rendered canvas
          const maskTexture = Texture.fromImageBitmap(
            rendered.canvas as unknown as ImageBitmap
          );
          maskTexture.width = tagBox.dimensions.x;
          maskTexture.height = tagBox.dimensions.y;
          maskTexture.data = rendered.canvas;

          return {
            mask: maskTexture,
            position: new Vector(tagBox.position.x, tagBox.position.y),
          };
        });
        player.ghostGraphics.isVisible = true;
      } else {
        player.ghostGraphics.clipRegion = undefined;
        player.ghostGraphics.isVisible = false;
      }
    });
  }
}
