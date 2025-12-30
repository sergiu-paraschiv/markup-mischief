import { Scene, Vector } from '@engine/core';
import { SpriteMash, SpriteMashData } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import {
  Character,
  CaptainClownNose,
  Tag,
  Wall,
  Platform,
} from '@game/entities';
import {
  LevelData,
  gridToPixel,
  generateRandomTagPositions,
  HTML_PLATFORM_CONFIG,
  CSS_LEFT_PLATFORM_CONFIG,
  CSS_RIGHT_PLATFORM_CONFIG,
  PlatformConfig,
  PositionData,
} from './LevelData';
import { PLAYER_DEPTH, TAG_DEPTH, PLAYER_OUTLINE_DEPTH } from './constants';
import BOARD_BACKGROUND_DATA from './Board_Background.json';
import BOARD_CSS_BACKGROUND_OVERLAU_DATA from './Board_CSS_BackgroundOverlay.json';
import CharacterSelectionManager from '../../CharacterSelectionManager';

const LEVEL_WIDTH = 24;
const LEVEL_HEIGHT = 16;

type LevelMode = 'html' | 'css';

/**
 * Builds and populates a level from level data.
 *
 * Uses platform configurations to automatically generate platforms and
 * determine valid tag positions. Platform layouts are defined in LevelData.ts.
 */
export class LevelBuilder {
  private scene: Scene;
  private levelData: LevelData;
  private mode: LevelMode;
  private htmlPlatformConfig: PlatformConfig;
  private cssPlatformConfig: PlatformConfig | undefined;

  constructor(scene: Scene, levelData: LevelData, mode: LevelMode) {
    this.scene = scene;
    this.levelData = levelData;
    this.mode = mode;

    // Set platform configs based on mode
    if (mode === 'html') {
      this.htmlPlatformConfig = HTML_PLATFORM_CONFIG;
    } else {
      this.htmlPlatformConfig = CSS_LEFT_PLATFORM_CONFIG;
      this.cssPlatformConfig = CSS_RIGHT_PLATFORM_CONFIG;
    }
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
    const boardBg = SpriteMash.fromData(
      BOARD_BACKGROUND_DATA as SpriteMashData
    );

    this.scene.addChild(boardBg);
    if (this.mode === 'css') {
      this.scene.addChild(
        SpriteMash.fromData(BOARD_CSS_BACKGROUND_OVERLAU_DATA as SpriteMashData)
      );
    }
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
        new Vector(32 * (LEVEL_WIDTH - 4), 32 * (LEVEL_HEIGHT - 3)),
        new Vector(32 * 3, 32 * 2)
      )
    );

    if (this.mode === 'css') {
      // Middle wall
      this.scene.addChild(
        makeEdgeWall(
          new Vector(32 * 11, 0),
          new Vector(32, 32 * (LEVEL_HEIGHT - 1))
        )
      );
    }
  }

  private buildPlatforms(): void {
    // Build HTML/left side platforms
    this.htmlPlatformConfig.platforms.forEach(platform => {
      this.scene.addChild(
        makePlatformWall(
          new Vector(32 * platform.x, 32 * platform.y),
          new Vector(32 * platform.width, 1)
        )
      );
    });

    // Build CSS/right side platforms if in CSS mode
    if (this.cssPlatformConfig) {
      this.cssPlatformConfig.platforms.forEach(platform => {
        this.scene.addChild(
          makePlatformWall(
            new Vector(32 * platform.x, 32 * platform.y),
            new Vector(32 * platform.width, 1)
          )
        );
      });
    }
  }

  private buildPlayers(): { player1: Character; player2?: Character } {
    const characterManager = CharacterSelectionManager.getInstance();

    const player1 = characterManager.createSelectedCharacter(
      gridToPixel(
        this.htmlPlatformConfig.playerStartGrid,
        this.htmlPlatformConfig
      )
    );
    this.scene.addChild(player1, PLAYER_DEPTH);
    // Add ghost at a higher depth so it renders on top of tags
    this.scene.addChild(player1.ghost, PLAYER_OUTLINE_DEPTH);

    // In CSS mode, add the second character (always Captain Clown Nose for player 2)
    if (this.cssPlatformConfig && this.levelData.css) {
      const player2 = new CaptainClownNose(
        gridToPixel(
          this.cssPlatformConfig.playerStartGrid,
          this.cssPlatformConfig
        )
      );
      this.scene.addChild(player2, PLAYER_DEPTH);
      this.scene.addChild(player2.ghost, PLAYER_OUTLINE_DEPTH);

      return { player1, player2 };
    }

    return { player1 };
  }

  private buildTags(): void {
    // Generate HTML tags with positions that don't match the solution
    const { tags: htmlTags, positions: htmlPositions } =
      this.generateNonWinningTagLayout(
        this.levelData.html.tags,
        this.htmlPlatformConfig
      );

    // Add HTML tags at the generated positions
    htmlTags.forEach((tagText, index) => {
      this.scene.addChild(
        makeTagTile(
          gridToPixel(htmlPositions[index], this.htmlPlatformConfig),
          tagText,
          'html'
        ),
        TAG_DEPTH
      );
    });

    // Add CSS tags (only in CSS mode)
    if (this.cssPlatformConfig && this.levelData.css) {
      const { tags: cssTags, positions: cssPositions } =
        this.generateNonWinningTagLayout(
          this.levelData.css.tags,
          this.cssPlatformConfig
        );

      cssTags.forEach((tagText, index) => {
        this.scene.addChild(
          makeTagTile(
            gridToPixel(cssPositions[index], this.cssPlatformConfig!),
            tagText,
            'css'
          ),
          TAG_DEPTH
        );
      });
    }
  }

  /**
   * Generates tag layout (shuffled tags + random positions) that doesn't result in winning state.
   * Keeps trying until the spatial arrangement differs from the solution.
   */
  private generateNonWinningTagLayout(
    solutionTags: string[],
    config: PlatformConfig
  ): { tags: string[]; positions: PositionData[] } {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      // Shuffle tags
      const shuffledTags = this.shuffleArray([...solutionTags]);

      // Generate random positions
      const positions = generateRandomTagPositions(
        shuffledTags.length,
        config,
        shuffledTags
      );

      // Sort positions spatially (same logic as WinConditionChecker)
      const sortedIndices = this.getSpatialSortOrder(positions, config);

      // Create the spatially sorted tag sequence
      const spatialSequence = sortedIndices.map(idx => shuffledTags[idx]);

      // Check if spatial sequence matches solution
      if (!this.arraysEqual(spatialSequence, solutionTags)) {
        return { tags: shuffledTags, positions };
      }
    }

    // Fallback: if we can't find a non-winning layout after many attempts,
    // just return a shuffled version (very unlikely for this to match spatially)
    console.warn(
      'Could not generate non-winning layout after max attempts, using shuffled fallback'
    );
    const shuffledTags = this.shuffleArray([...solutionTags]);
    const positions = generateRandomTagPositions(
      shuffledTags.length,
      config,
      shuffledTags
    );
    return { tags: shuffledTags, positions };
  }

  /**
   * Returns indices sorted by spatial position (Y first with tolerance, then X)
   * Mimics the sorting logic from WinConditionChecker
   */
  private getSpatialSortOrder(
    positions: PositionData[],
    config: PlatformConfig
  ): number[] {
    const rowTolerance = 16; // Same as WinConditionChecker
    const pixelPositions = positions.map(pos => gridToPixel(pos, config));

    // Create array of indices
    const indices = positions.map((_, idx) => idx);

    // Sort indices based on spatial position
    return indices.sort((aIdx, bIdx) => {
      const a = pixelPositions[aIdx];
      const b = pixelPositions[bIdx];
      const yDiff = Math.abs(a.y - b.y);

      // If Y positions are within tolerance, sort by X
      if (yDiff < rowTolerance) {
        return a.x - b.x;
      }

      // Different rows - sort by Y
      return a.y - b.y;
    });
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   * Ensures the shuffled array is different from the original
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    let attempts = 0;
    const maxAttempts = 100;

    // Keep shuffling until we get a different order
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      attempts++;
    } while (this.arraysEqual(shuffled, array) && attempts < maxAttempts);

    return shuffled;
  }

  /**
   * Checks if two arrays are equal
   */
  private arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
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
export function makePlatformWall(position: Vector, size: Vector) {
  const platform = new Platform(position, size);

  platform.filterCollisionFn = ({ collider, velocity }) => {
    // Check if the specific character is dropping, not a shared flag
    if (collider instanceof Character && collider.isDropping) {
      return false;
    }

    if (collider instanceof Character && velocity.y <= 0) {
      return false;
    }

    return true;
  };

  return platform;
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
