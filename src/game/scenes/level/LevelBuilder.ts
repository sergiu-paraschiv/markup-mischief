import { Scene, Vector } from '@engine/core';
import { SpriteMash, SpriteMashData } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import {
  Character,
  PinkStar,
  CaptainClownNose,
  Tag,
  Wall,
} from '@game/entities';
import {
  LevelData,
  gridToPixelHtml,
  gridToPixelCss,
  generateRandomTagPositions,
} from './LevelData';
import { PLAYER_DEPTH, TAG_DEPTH, PLAYER_OUTLINE_DEPTH } from './constants';
import HTML_BOARD_DATA from './BoardHTML.json';
import CSS_BOARD_DATA from './BoardCSS.json';

const LEVEL_WIDTH = 24;
const LEVEL_HEIGHT = 16;

type LevelMode = 'html' | 'css';

/**
 * Builds and populates a level from level data.
 *
 * Level coordinates use a grid-based system:
 * - X axis: 0-4 (5 sections of 64px each for wider tag spacing)
 * - Y axis: 0-5 (6 platforms, with 0 being ground level)
 * - Total tag positions: 5x5 = 25 (excluding ground)
 *
 * Grid coordinates are automatically converted to pixel coordinates based on:
 * - LEVEL_HEIGHT constant for calculating ground position
 * - Platform spacing of 64px vertically
 * - Section width of 64px horizontally
 */
export class LevelBuilder {
  private scene: Scene;
  private levelData: LevelData;
  private mode: LevelMode;

  constructor(scene: Scene, levelData: LevelData, mode: LevelMode) {
    this.scene = scene;
    this.levelData = levelData;
    this.mode = mode;
  }

  /**
   * Builds the complete level including background, walls, platforms, tags, and player(s)
   */
  build(): { player1: Character; player2?: Character } {
    this.buildBackground();
    this.buildWalls();
    this.buildPlatforms();
    this.buildTags();

    return this.buildPlayers();
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

    // Bottom-right corner wall
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
            new Vector(32 * 10, 1)
          )
        );
      }
    } else {
      for (let i = LEVEL_HEIGHT - 6; i <= LEVEL_HEIGHT - 2; i += 1) {
        this.scene.addChild(
          makePlatformWall(new Vector(32, 2 + 32 * i), new Vector(32 * 8, 1))
        );
      }
      for (let i = LEVEL_HEIGHT - 6; i <= LEVEL_HEIGHT - 2; i += 1) {
        this.scene.addChild(
          makePlatformWall(
            new Vector(32 * 10, 2 + 32 * i),
            new Vector(32 * 9, 1)
          )
        );
      }
    }
  }

  private buildPlayers(): { player1: Character; player2?: Character } {
    // Player always starts at x=2, y=0 (center of 5 sections)
    const defaultPlayerStart = { x: 2, y: 0 };

    const player1 = new PinkStar(
      gridToPixelHtml(defaultPlayerStart, LEVEL_HEIGHT)
    );
    this.scene.addChild(player1, PLAYER_DEPTH);
    // Add ghost at a higher depth so it renders on top of tags
    this.scene.addChild(player1.ghost, PLAYER_OUTLINE_DEPTH);

    // In CSS mode, add the second character
    if (this.mode === 'css' && this.levelData.css) {
      const player2 = new CaptainClownNose(
        gridToPixelCss(defaultPlayerStart, LEVEL_HEIGHT, true)
      );
      this.scene.addChild(player2, PLAYER_DEPTH);
      this.scene.addChild(player2.ghost, PLAYER_OUTLINE_DEPTH);

      return { player1, player2 };
    }

    return { player1 };
  }

  private buildTags(): void {
    // Generate random positions for HTML tags
    const htmlPositions = generateRandomTagPositions(
      this.levelData.html.tags.length
    );

    // Shuffle tags to ensure they don't start in solution order
    const shuffledHtmlTags = this.shuffleArray([...this.levelData.html.tags]);

    // Add HTML tags at random positions
    shuffledHtmlTags.forEach((tagText, index) => {
      this.scene.addChild(
        makeTagTile(
          gridToPixelHtml(htmlPositions[index], LEVEL_HEIGHT),
          tagText,
          'html'
        ),
        TAG_DEPTH
      );
    });

    // Add CSS tags (only in CSS mode)
    if (this.mode === 'css' && this.levelData.css) {
      const cssPositions = generateRandomTagPositions(
        this.levelData.css.tags.length
      );

      const shuffledCssTags = this.shuffleArray([...this.levelData.css.tags]);

      shuffledCssTags.forEach((tagText, index) => {
        this.scene.addChild(
          makeTagTile(
            gridToPixelCss(cssPositions[index], LEVEL_HEIGHT, true),
            tagText,
            'css'
          ),
          TAG_DEPTH
        );
      });
    }
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
export function makePlatformWall(position: Vector, size: Vector): StaticBody {
  const body = new StaticBody(position);
  body.addChild(new Wall(position, size));

  body.filterCollisionFn = ({ collider, velocity }) => {
    // Check if the specific character is dropping, not a shared flag
    if (collider instanceof Character && collider.isDropping) {
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
  tagType: 'html' | 'css'
): Tag {
  const tag = new Tag(position, text, tagType);

  tag.filterCollisionFn = ({ collider, velocity }) => {
    // Check if the specific character is dropping, not a shared flag
    if (collider instanceof Character && collider.isDropping) {
      return false;
    }

    if (collider instanceof Character && velocity.y <= 0) {
      return false;
    }

    return true;
  };

  return tag;
}
