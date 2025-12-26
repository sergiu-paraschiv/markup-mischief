/**
 * Manages level progression using localStorage
 * Tracks the furthest level the player has reached for each game mode
 */

const STORAGE_KEY = 'markup-mischief-progress';

export type GameMode = 'html' | 'css';

interface ModeProgress {
  currentLevel: number;
  lastPlayed?: string; // ISO timestamp
}

interface ProgressionData {
  html: ModeProgress;
  css: ModeProgress;
  lastMode?: GameMode; // Remember which mode was played last
}

export class LevelProgressionManager {
  private static instance: LevelProgressionManager;
  private data: ProgressionData;
  private currentMode: GameMode = 'html'; // Default mode

  private constructor() {
    this.data = this.loadFromStorage();
    this.currentMode = this.data.lastMode || 'html';
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LevelProgressionManager {
    if (!LevelProgressionManager.instance) {
      LevelProgressionManager.instance = new LevelProgressionManager();
    }
    return LevelProgressionManager.instance;
  }

  /**
   * Set the current game mode (html or css)
   */
  public setMode(mode: GameMode): void {
    this.currentMode = mode;
    this.data.lastMode = mode;
    this.saveToStorage();
  }

  /**
   * Get the current game mode
   */
  public getMode(): GameMode {
    return this.currentMode;
  }

  /**
   * Get the current level (furthest reached) for the active mode
   */
  public getCurrentLevel(): number {
    return this.data[this.currentMode].currentLevel;
  }

  /**
   * Get the current level for a specific mode
   */
  public getCurrentLevelForMode(mode: GameMode): number {
    return this.data[mode].currentLevel;
  }

  /**
   * Check if the player has any saved progress for the active mode
   */
  public hasSavedProgress(): boolean {
    return this.data[this.currentMode].currentLevel > 1;
  }

  /**
   * Check if the player has any saved progress for a specific mode
   */
  public hasSavedProgressForMode(mode: GameMode): boolean {
    return this.data[mode].currentLevel > 1;
  }

  /**
   * Advance to the next level (called when current level is completed)
   */
  public advanceToNextLevel(): void {
    this.data[this.currentMode].currentLevel++;
    this.data[this.currentMode].lastPlayed = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Reset progress back to level 1 for the active mode (New Game)
   */
  public resetProgress(): void {
    this.data[this.currentMode] = {
      currentLevel: 1,
      lastPlayed: new Date().toISOString(),
    };
    this.saveToStorage();
  }

  /**
   * Reset progress for a specific mode
   */
  public resetProgressForMode(mode: GameMode): void {
    this.data[mode] = {
      currentLevel: 1,
      lastPlayed: new Date().toISOString(),
    };
    this.saveToStorage();
  }

  /**
   * Set current level directly (useful for testing or skipping)
   */
  public setCurrentLevel(level: number): void {
    if (level < 1) {
      throw new Error('Level must be at least 1');
    }
    this.data[this.currentMode].currentLevel = level;
    this.data[this.currentMode].lastPlayed = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Get the last played timestamp for the active mode
   */
  public getLastPlayed(): string | undefined {
    return this.data[this.currentMode].lastPlayed;
  }

  /**
   * Get the last played timestamp for a specific mode
   */
  public getLastPlayedForMode(mode: GameMode): string | undefined {
    return this.data[mode].lastPlayed;
  }

  /**
   * Load progression data from localStorage
   */
  private loadFromStorage(): ProgressionData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Check if it's the old format (single currentLevel)
        if (typeof parsed.currentLevel === 'number') {
          // Migrate old format to new format
          return {
            html: {
              currentLevel: parsed.currentLevel,
              lastPlayed: parsed.lastPlayed,
            },
            css: {
              currentLevel: 1,
            },
            lastMode: 'html',
          };
        }

        // Validate new format
        if (
          parsed.html &&
          parsed.css &&
          typeof parsed.html.currentLevel === 'number' &&
          typeof parsed.css.currentLevel === 'number' &&
          parsed.html.currentLevel >= 1 &&
          parsed.css.currentLevel >= 1
        ) {
          return parsed as ProgressionData;
        }
      }
    } catch (error) {
      console.warn('Failed to load progression data:', error);
    }

    // Default: start at level 1 for both modes
    return {
      html: {
        currentLevel: 1,
      },
      css: {
        currentLevel: 1,
      },
    };
  }

  /**
   * Save progression data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save progression data:', error);
    }
  }

  /**
   * Clear all saved data (for debugging/testing)
   */
  public clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.data = {
        html: { currentLevel: 1 },
        css: { currentLevel: 1 },
      };
    } catch (error) {
      console.error('Failed to clear progression data:', error);
    }
  }
}
