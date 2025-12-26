import { Query, Scene } from '@engine/core';
import { Tag } from '@game/entities';
import { LevelData } from './LevelData';

/**
 * Handles win condition checking for game levels
 */
export class WinConditionChecker {
  private scene: Scene;
  private levelData: LevelData;
  private readonly rowTolerance: number = 16; // Pixels within which tags are considered on same row

  constructor(scene: Scene, levelData: LevelData) {
    this.scene = scene;
    this.levelData = levelData;
  }

  getCurrentHtml(): string {
    const tags = Query.childrenByType(Tag, this.scene);
    const sortedTags = this.sortTags(tags);
    return sortedTags.map(tag => tag.text).join(' ');
  }

  isCorrect(): boolean {
    const html = this.getCurrentHtml();
    return html === this.levelData.solution;
  }

  /**
   * Sorts tags by position with Y-axis tolerance for rows
   * Tags within rowTolerance pixels vertically are considered on the same row
   */
  private sortTags(tags: Tag[]): Tag[] {
    return [...tags].sort((a, b) => {
      const yDiff = Math.abs(a.position.y - b.position.y);

      // If Y positions are within tolerance, consider them same row - sort by X
      if (yDiff < this.rowTolerance) {
        return a.position.x - b.position.x;
      }

      // Different rows - sort by Y
      return a.position.y - b.position.y;
    });
  }

  getSolution(): string {
    return this.levelData.solution;
  }
}
