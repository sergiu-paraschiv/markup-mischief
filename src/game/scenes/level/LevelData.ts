import { Vector } from '@engine/core';

export interface PositionData {
  x: number;
  y: number;
}

export interface TagData {
  position: PositionData;
  text: string;
}

export interface CodeSection {
  playerStart: PositionData;
  tags: TagData[];
  solution: string;
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
 * Helper function to convert PositionData to Vector
 */
export function positionToVector(position: PositionData): Vector {
  return new Vector(position.x, position.y);
}
