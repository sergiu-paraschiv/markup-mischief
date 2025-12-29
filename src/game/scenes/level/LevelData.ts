import { Vector } from '@engine/core';

/**
 * Grid-based position using logical coordinates.
 *
 * For HTML mode:
 * - X axis: 0-4 representing 5 sections (wider to prevent tag overlap), left to right
 * - Y axis: 0-5 representing 6 platforms stacked vertically, bottom to top
 *   - y=0: ground/floor platform
 *   - y=1-5: elevated platforms above ground
 * - Total positions: 5x5 = 25 possible tag locations (excluding ground)
 *
 * Default player start: x=2, y=0 (center of ground platform)
 */
export interface PositionData {
  x: number; // 0-4 for HTML mode
  y: number; // 0-5 for platforms
}

export interface CodeSection {
  tags: string[]; // Array of tag text (positions generated randomly, solution is tags.join(' '))
}

export interface LevelData {
  id: number;
  name: string;
  html: CodeSection; // Always present
  css?: CodeSection; // Optional, only for CSS mode levels
}

export interface LevelsData {
  htmlLevels: LevelData[];
  cssLevels: LevelData[];
}

/**
 * Converts grid coordinates to pixel coordinates for HTML mode.
 *
 * The conversion is based on the game board structure:
 * - Platforms start at X = 96px (32 * 3) and are 320px wide total (10 tiles)
 * - 5 horizontal sections means each section is 64px wide (2 tiles)
 * - Ground platform (y=0) is at the bottom, just above the bottom edge wall
 * - Each platform level is 64px apart vertically
 *
 * @param position Grid position (x: 0-4, y: 0-5)
 * @param levelHeight Total height of the level in tiles (typically 16)
 * @returns Pixel position as a Vector
 */
export function gridToPixelHtml(
  position: PositionData,
  levelHeight: number
): Vector {
  const GRID_SIZE = 32;
  const SECTION_WIDTH = 64; // 2 tiles per section for wider spacing
  const HTML_PLATFORM_START_X = 96; // 32 * 3

  // Platform Y positions (top surface where tags should sit)
  // Platforms are built at: i = LEVEL_HEIGHT - 6 to LEVEL_HEIGHT - 2
  // Platform Y = 2 + 32 * i
  // For LEVEL_HEIGHT = 16: i = 10,11,12,13,14 (5 platforms)
  // Y positions: 322, 354, 386, 418, 450
  // Grid y=0 (ground) is the lowest platform (i=14, Y=450)
  // Grid y=1-5 are the platforms above: i=13,12,11,10 + one more above

  const pixelX = HTML_PLATFORM_START_X + position.x * SECTION_WIDTH;

  // Map grid y to platform index: y=0 -> i=14, y=1 -> i=13, etc.
  const lastPlatformIndex = levelHeight - 2; // i = 14
  const platformIndex = lastPlatformIndex - position.y;
  const platformY = 2 + GRID_SIZE * platformIndex;
  const TAG_OFFSET = 20; // Spawn slightly above platform surface
  const pixelY = platformY - TAG_OFFSET;

  return new Vector(pixelX, pixelY);
}

/**
 * Converts grid coordinates to pixel coordinates for CSS mode.
 * CSS mode has two separate play areas divided by a middle wall.
 *
 * @param position Grid position
 * @param levelHeight Total height of the level in tiles (typically 16)
 * @param isRightSide Whether this is for the right side (CSS) or left side (HTML)
 * @returns Pixel position as a Vector
 */
export function gridToPixelCss(
  position: PositionData,
  levelHeight: number,
  isRightSide: boolean
): Vector {
  const GRID_SIZE = 32;
  const PLATFORM_SPACING = 64;
  const LEFT_PLATFORM_START_X = 32;
  const RIGHT_PLATFORM_START_X = 320; // 32 * 10

  // Calculate ground level Y position (just above bottom edge wall)
  const groundY = GRID_SIZE * (levelHeight - 1) - GRID_SIZE;

  const pixelX =
    (isRightSide ? RIGHT_PLATFORM_START_X : LEFT_PLATFORM_START_X) +
    position.x * GRID_SIZE;
  const pixelY = groundY - position.y * PLATFORM_SPACING;

  return new Vector(pixelX, pixelY);
}

/**
 * Generates random grid positions for tags, ensuring no duplicates.
 * Tags are placed on platforms y=0-4 and x=0-4.
 * This gives 25 possible positions (5x5 grid).
 *
 * @param tagCount Number of tags to place
 * @returns Array of random, unique grid positions
 */
export function generateRandomTagPositions(tagCount: number): PositionData[] {
  const positions: PositionData[] = [];
  const usedPositions = new Set<string>();

  while (positions.length < tagCount) {
    // Random platform (0-4, using all 5 platforms)
    const y = Math.floor(Math.random() * 5);
    // Random x position (0-4)
    const x = Math.floor(Math.random() * 5);

    const key = `${x},${y}`;
    if (!usedPositions.has(key)) {
      usedPositions.add(key);
      positions.push({ x, y });
    }
  }

  return positions;
}
