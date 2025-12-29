import { Vector } from '@engine/core';

/**
 * Grid-based position using logical coordinates.
 * Grid dimensions are determined by the platform configuration.
 */
export interface PositionData {
  x: number;
  y: number;
}

/**
 * Defines a single platform in the level.
 */
export interface PlatformDefinition {
  x: number; // X position in tiles
  y: number; // Y position in tiles
  width: number; // Width in tiles
}

/**
 * Configuration for platform layout in a game mode.
 */
export interface PlatformConfig {
  platforms: PlatformDefinition[];
  gridConfig: {
    xMin: number; // Minimum X grid coordinate
    xMax: number; // Maximum X grid coordinate (inclusive)
    yMin: number; // Minimum Y grid coordinate
    yMax: number; // Maximum Y grid coordinate (inclusive)
    sectionWidth: number; // Width of each grid section in pixels
    verticalSpacing: number; // Vertical spacing between platforms in pixels
  };
  playerStartGrid: PositionData; // Player start position in grid coordinates
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

// Level constants
const GRID_SIZE = 32;
const TAG_OFFSET = 20; // Spawn slightly above platform surface

/**
 * Platform configuration for HTML mode
 */
export const HTML_PLATFORM_CONFIG: PlatformConfig = {
  platforms: [
    // 6 platforms from bottom to top (i = 14 down to 9)
    { x: 5, y: 14, width: 10 },
    { x: 5, y: 13, width: 10 },
    { x: 5, y: 12, width: 10 },
    { x: 5, y: 11, width: 10 },
    { x: 5, y: 10, width: 10 },
    { x: 5, y: 9, width: 10 },
  ],
  gridConfig: {
    xMin: 0,
    xMax: 4, // 5 sections (0-4)
    yMin: 0,
    yMax: 5, // 6 platforms (0-5)
    sectionWidth: 64, // 2 tiles per section
    verticalSpacing: 32, // One tile per platform level
  },
  playerStartGrid: { x: 2, y: 0 },
};

/**
 * Platform configuration for CSS mode (left side - HTML)
 */
export const CSS_LEFT_PLATFORM_CONFIG: PlatformConfig = {
  platforms: [
    { x: 1, y: 14, width: 10 },
    { x: 1, y: 13, width: 10 },
    { x: 1, y: 12, width: 10 },
    { x: 1, y: 11, width: 10 },
    { x: 1, y: 10, width: 10 },
    { x: 1, y: 9, width: 10 },
  ],
  gridConfig: {
    xMin: 0,
    xMax: 9, // 10 tiles width (0-9)
    yMin: 0,
    yMax: 5, // 6 platforms (0-5)
    sectionWidth: 32, // 1 tile per section in CSS mode
    verticalSpacing: 32,
  },
  playerStartGrid: { x: 4, y: 0 },
};

/**
 * Platform configuration for CSS mode (right side - CSS)
 */
export const CSS_RIGHT_PLATFORM_CONFIG: PlatformConfig = {
  platforms: [
    { x: 12, y: 14, width: 10 },
    { x: 12, y: 13, width: 10 },
    { x: 12, y: 12, width: 8 },
    { x: 12, y: 11, width: 8 },
    { x: 12, y: 10, width: 8 },
    { x: 12, y: 9, width: 8 },
  ],
  gridConfig: {
    xMin: 0,
    xMax: 7, // Up to 8 tiles for shorter platforms, 10 for longer
    yMin: 0,
    yMax: 5, // 6 platforms (0-5)
    sectionWidth: 32, // 1 tile per section in CSS mode
    verticalSpacing: 32,
  },
  playerStartGrid: { x: 4, y: 0 },
};

/**
 * Converts grid coordinates to pixel coordinates based on platform configuration.
 *
 * @param position Grid position (y=0 is ground/bottom, increasing y goes up)
 * @param config Platform configuration
 * @returns Pixel position as a Vector
 */
export function gridToPixel(
  position: PositionData,
  config: PlatformConfig
): Vector {
  const { gridConfig, platforms } = config;

  // Find the platform for this Y level
  // position.y=0 should map to the first platform (bottom), position.y=5 to the last (top)
  const platformIndex = position.y;
  const platform = platforms[platformIndex];

  if (!platform) {
    throw new Error(
      `No platform found for grid position y=${position.y} (platform index ${platformIndex})`
    );
  }

  // Calculate pixel X position
  const pixelX = platform.x * GRID_SIZE + position.x * gridConfig.sectionWidth;

  // Calculate pixel Y position
  const pixelY = platform.y * GRID_SIZE - TAG_OFFSET;

  return new Vector(pixelX, pixelY);
}

/**
 * Generates random grid positions for tags, ensuring no duplicates.
 *
 * @param tagCount Number of tags to place
 * @param config Platform configuration defining valid grid bounds
 * @returns Array of random, unique grid positions
 */
export function generateRandomTagPositions(
  tagCount: number,
  config: PlatformConfig
): PositionData[] {
  const positions: PositionData[] = [];
  const usedPositions = new Set<string>();
  const { gridConfig } = config;

  const xRange = gridConfig.xMax - gridConfig.xMin + 1;
  const yRange = gridConfig.yMax - gridConfig.yMin + 1;

  if (tagCount > xRange * yRange) {
    throw new Error(
      `Cannot place ${tagCount} tags in a ${xRange}x${yRange} grid (max ${xRange * yRange} positions)`
    );
  }

  while (positions.length < tagCount) {
    const y = Math.floor(Math.random() * yRange) + gridConfig.yMin;
    const x = Math.floor(Math.random() * xRange) + gridConfig.xMin;

    const key = `${x},${y}`;
    if (!usedPositions.has(key)) {
      usedPositions.add(key);
      positions.push({ x, y });
    }
  }

  return positions;
}
