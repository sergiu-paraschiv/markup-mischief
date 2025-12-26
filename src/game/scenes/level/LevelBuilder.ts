import { Scene, Vector } from '@engine/core';
import { SpriteMash, SpriteMashData } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { BOARD_DATA, Character, PinkStar, Tag, Wall } from '@game/entities';
import { LevelData, positionToVector } from './LevelData';
import { PLAYER_DEPTH, TAG_DEPTH, PLAYER_OUTLINE_DEPTH } from './constants';

/**
 * Factory function to create solid edge walls
 */
export function makeEdgeWall(position: Vector, size: Vector): StaticBody {
  const body = new StaticBody(position);
  body.addChild(new Wall(position, size));

  return body;
}

/**
 * Factory function to create one-way platform walls
 * Characters can drop through and jump through from below
 */
export function makePlatformWall(
  position: Vector,
  size: Vector,
  dropping: () => boolean
): StaticBody {
  const body = new StaticBody(position);
  body.addChild(new Wall(position, size));

  body.filterCollisionFn = ({ collider, velocity }) => {
    if (collider instanceof Character && dropping()) {
      return false;
    }

    if (collider instanceof Character && velocity.y <= 0) {
      return false;
    }

    return true;
  };

  return body;
}

/**
 * Factory function to create tag blocks
 * Tags behave like one-way platforms for the character
 */
export function makeTagTile(
  position: Vector,
  text: string,
  dropping: () => boolean
): Tag {
  const tag = new Tag(position, text);

  tag.filterCollisionFn = ({ collider, velocity }) => {
    if (collider instanceof Character && dropping()) {
      return false;
    }

    if (collider instanceof Character && velocity.y <= 0) {
      return false;
    }

    return true;
  };

  return tag;
}

/**
 * Builds and populates a level from level data
 */
export class LevelBuilder {
  private scene: Scene;
  private levelData: LevelData;
  private dropping: () => boolean;

  constructor(scene: Scene, levelData: LevelData, dropping: () => boolean) {
    this.scene = scene;
    this.levelData = levelData;
    this.dropping = dropping;
  }

  /**
   * Builds the complete level including background, walls, platforms, tags, and player
   */
  build(): PinkStar {
    this.buildBackground();
    this.buildWalls();
    this.buildPlatforms();
    this.buildTags();

    return this.buildPlayer();
  }

  private buildBackground(): void {
    const board = SpriteMash.fromData(BOARD_DATA as SpriteMashData);
    this.scene.addChild(board);
  }

  private buildWalls(): void {
    // Left edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(0, 0), new Vector(32, 32 * 12))
    );

    // Right edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(32 * 15, 0), new Vector(32, 32 * 12))
    );

    // Top edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(32, 0), new Vector(32 * 14, 32))
    );

    // Bottom edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(32, 32 * 11), new Vector(32 * 14, 32))
    );

    // Top-right corner wall
    this.scene.addChild(
      makeEdgeWall(new Vector(32 * 11, 32 * 9), new Vector(32 * 4, 32 * 2))
    );
  }

  private buildPlatforms(): void {
    // Left side vertical platforms
    for (let i = 6; i <= 10; i += 1) {
      this.scene.addChild(
        makePlatformWall(
          new Vector(32 * 1, 2 + 32 * i),
          new Vector(32 * 9, 1),
          this.dropping
        )
      );
    }

    // Middle platform
    this.scene.addChild(
      makePlatformWall(
        new Vector(32 * 10 + 24, 2 + 32 * 8),
        new Vector(22, 1),
        this.dropping
      )
    );

    // Right platform
    this.scene.addChild(
      makePlatformWall(
        new Vector(32 * 13 + 24, 2 + 32 * 7),
        new Vector(22, 1),
        this.dropping
      )
    );

    // Upper platform
    this.scene.addChild(
      makePlatformWall(
        new Vector(32 * 6 + 24, 2 + 32 * 4),
        new Vector(22, 1),
        this.dropping
      )
    );
  }

  private buildPlayer(): PinkStar {
    const player = new PinkStar(positionToVector(this.levelData.playerStart));
    this.scene.addChild(player, PLAYER_DEPTH);
    // Add ghost at a higher depth so it renders on top of tags
    this.scene.addChild(player.ghost, PLAYER_OUTLINE_DEPTH);

    return player;
  }

  private buildTags(): void {
    this.levelData.tags.forEach(tagData => {
      this.scene.addChild(
        makeTagTile(
          positionToVector(tagData.position),
          tagData.text,
          this.dropping
        ),
        TAG_DEPTH
      );
    });
  }
}
