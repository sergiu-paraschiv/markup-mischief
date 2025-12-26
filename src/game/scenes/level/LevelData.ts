import { Vector } from '@engine/core';

export interface PositionData {
  x: number;
  y: number;
}

export interface TagData {
  position: PositionData;
  text: string;
}

export interface LevelData {
  id: number;
  name: string;
  playerStart: PositionData;
  tags: TagData[];
  solution: string;
}

export interface LevelsData {
  levels: LevelData[];
}

/**
 * Helper function to convert PositionData to Vector
 */
export function positionToVector(position: PositionData): Vector {
  return new Vector(position.x, position.y);
}
