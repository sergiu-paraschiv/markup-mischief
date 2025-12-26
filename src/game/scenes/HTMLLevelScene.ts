import { BaseLevelScene } from './BaseLevelScene';
import { LevelData, LevelsData } from './level/LevelData';

/**
 * HTML game mode level scene
 * Uses HTML-specific board layout and loads levels from htmlLevels array
 */
export default class HTMLLevelScene extends BaseLevelScene {
  protected getMode(): 'html' | 'css' {
    return 'html';
  }

  protected getLevelArray(levelsData: LevelsData): LevelData[] {
    return levelsData.htmlLevels;
  }
}
