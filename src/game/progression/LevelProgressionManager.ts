/**
 * Manages level progression using localStorage
 * Tracks the furthest level the player has reached
 */

const STORAGE_KEY = 'markup-mischief-progress';

interface ProgressionData {
  currentLevel: number;
  lastPlayed?: string; // ISO timestamp
}

export class LevelProgressionManager {
  private static instance: LevelProgressionManager;
  private data: ProgressionData;

  private constructor() {
    this.data = this.loadFromStorage();
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
   * Get the current level (furthest reached)
   */
  public getCurrentLevel(): number {
    return this.data.currentLevel;
  }

  /**
   * Check if the player has any saved progress
   */
  public hasSavedProgress(): boolean {
    return this.data.currentLevel > 1;
  }

  /**
   * Advance to the next level (called when current level is completed)
   */
  public advanceToNextLevel(): void {
    this.data.currentLevel++;
    this.data.lastPlayed = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Reset progress back to level 1 (New Game)
   */
  public resetProgress(): void {
    this.data = {
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
    this.data.currentLevel = level;
    this.data.lastPlayed = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Get the last played timestamp
   */
  public getLastPlayed(): string | undefined {
    return this.data.lastPlayed;
  }

  /**
   * Load progression data from localStorage
   */
  private loadFromStorage(): ProgressionData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProgressionData;
        // Validate data
        if (
          typeof parsed.currentLevel === 'number' &&
          parsed.currentLevel >= 1
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load progression data:', error);
    }

    // Default: start at level 1
    return {
      currentLevel: 1,
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
      this.data = { currentLevel: 1 };
    } catch (error) {
      console.error('Failed to clear progression data:', error);
    }
  }
}
