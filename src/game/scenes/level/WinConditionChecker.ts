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
  private isCssMode: boolean;

  constructor(scene: Scene, levelData: LevelData, mode: 'html' | 'css') {
    this.scene = scene;
    this.levelData = levelData;
    this.isCssMode = mode === 'css';
  }

  getCurrentHtml(): string {
    const tags = Query.childrenByType(Tag, this.scene);
    const htmlTags = tags.filter(tag => tag.tagType === 'html');
    const sortedTags = this.sortTags(htmlTags);
    return sortedTags.map(tag => tag.text).join(' ');
  }

  getCurrentCss(): string {
    const tags = Query.childrenByType(Tag, this.scene);
    const cssTags = tags.filter(tag => tag.tagType === 'css');
    const sortedTags = this.sortTags(cssTags);
    return sortedTags.map(tag => tag.text).join(' ');
  }

  isCorrect(): boolean {
    const html = this.getCurrentHtml();
    const htmlCorrect = html === this.levelData.html.solution;

    // In HTML mode, only check HTML solution
    if (!this.isCssMode) {
      return htmlCorrect;
    }

    // In CSS mode, check both HTML and CSS solutions
    const css = this.getCurrentCss();
    const cssCorrect = this.levelData.css
      ? css === this.levelData.css.solution
      : true;

    return htmlCorrect && cssCorrect;
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

  getHtmlSolution(): string {
    return this.levelData.html.solution;
  }

  getCssSolution(): string {
    return this.levelData.css?.solution || '';
  }
}
