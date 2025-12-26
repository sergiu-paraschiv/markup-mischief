import { Scene, Vector } from '@engine/core';
import { SpriteMash, SpriteMashData } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import { Character, PinkStar, Tag, Wall } from '@game/entities';
import { LevelData, positionToVector } from './LevelData';
import { PLAYER_DEPTH, TAG_DEPTH, PLAYER_OUTLINE_DEPTH } from './constants';
import HTML_BOARD_DATA from './BoardHTML.json';
import CSS_BOARD_DATA from './BoardCSS.json';

const LEVEL_WIDTH = 24;
const LEVEL_HEIGHT = 16;

type LevelMode = 'html' | 'css';

/**
 * Builds and populates a level from level data
 */
export class LevelBuilder {
  private scene: Scene;
  private levelData: LevelData;
  private mode: LevelMode;
  private dropping: () => boolean;

  constructor(
    scene: Scene,
    levelData: LevelData,
    mode: LevelMode,
    dropping: () => boolean
  ) {
    this.scene = scene;
    this.levelData = levelData;
    this.mode = mode;
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
    const board = SpriteMash.fromData(
      this.mode === 'html'
        ? (HTML_BOARD_DATA as SpriteMashData)
        : (CSS_BOARD_DATA as SpriteMashData)
    );
    this.scene.addChild(board);
  }

  private buildWalls(): void {
    // Left edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(0, 0), new Vector(32, 32 * LEVEL_HEIGHT))
    );

    // Right edge wall
    this.scene.addChild(
      makeEdgeWall(
        new Vector(32 * (LEVEL_WIDTH - 1), 0),
        new Vector(32, 32 * LEVEL_HEIGHT)
      )
    );

    // Top edge wall
    this.scene.addChild(
      makeEdgeWall(new Vector(32, 0), new Vector(32 * LEVEL_WIDTH, 32))
    );

    // Bottom edge wall
    this.scene.addChild(
      makeEdgeWall(
        new Vector(32, 32 * (LEVEL_HEIGHT - 1)),
        new Vector(32 * LEVEL_WIDTH, 32)
      )
    );

    // Top-right corner wall
    this.scene.addChild(
      makeEdgeWall(
        new Vector(32 * (LEVEL_WIDTH - 6), 32 * (LEVEL_HEIGHT - 3)),
        new Vector(32 * 5, 32 * 2)
      )
    );

    if (this.mode === 'css') {
      // Middle wall
      this.scene.addChild(
        makeEdgeWall(
          new Vector(32 * 9, 0),
          new Vector(32, 32 * (LEVEL_HEIGHT - 1))
        )
      );
    }
  }

  private buildPlatforms(): void {
    if (this.mode === 'html') {
      for (let i = LEVEL_HEIGHT - 6; i <= LEVEL_HEIGHT - 2; i += 1) {
        this.scene.addChild(
          makePlatformWall(
            new Vector(32 * 3, 2 + 32 * i),
            new Vector(32 * 10, 1),
            this.dropping
          )
        );
      }
    } else {
      for (let i = LEVEL_HEIGHT - 6; i <= LEVEL_HEIGHT - 2; i += 1) {
        this.scene.addChild(
          makePlatformWall(
            new Vector(32, 2 + 32 * i),
            new Vector(32 * 8, 1),
            this.dropping
          )
        );
      }
    }
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
