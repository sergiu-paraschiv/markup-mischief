import { BaseLevelScene } from './BaseLevelScene';
import { LevelData, LevelsData } from './level/LevelData';

/**
 * CSS game mode level scene
 * Uses CSS-specific board layout and loads levels from cssLevels array
 */
export default class CSSLevelScene extends BaseLevelScene {
  protected getMode(): 'html' | 'css' {
    return 'css';
  }

  protected getLevelArray(levelsData: LevelsData): LevelData[] {
    return levelsData.cssLevels;
  }
}
