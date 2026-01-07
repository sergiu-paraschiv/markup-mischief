/**
 * Manages level progression using AppWrite database
 * Tracks the furthest level the player has reached for each game mode
 */

import { DatabaseService, AuthStateManager } from '@game/services';

export type GameMode = 'html' | 'css';

interface ModeProgress {
  currentLevel: number;
}

interface ProgressionData {
  html: ModeProgress;
  css: ModeProgress;
}

export class LevelProgressionManager {
  private static instance: LevelProgressionManager;
  private data: ProgressionData;
  private currentMode: GameMode = 'html'; // Default mode
  private currentLevelStartTime: Date | null = null;

  private constructor() {
    this.data = {
      html: { currentLevel: 1 },
      css: { currentLevel: 1 },
    };
    // Data will be loaded asynchronously via initialize()
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
   * Initialize progression data from database
   * Must be called after authentication
   */
  public async initialize(): Promise<void> {
    if (!AuthStateManager.isAuthenticated || !AuthStateManager.userEmail) {
      console.warn('Cannot initialize progression: user not authenticated');
      return;
    }

    try {
      const htmlLevel = await DatabaseService.getHighestLevelForMode(
        AuthStateManager.userEmail,
        'html'
      );
      const cssLevel = await DatabaseService.getHighestLevelForMode(
        AuthStateManager.userEmail,
        'css'
      );

      this.data = {
        html: { currentLevel: htmlLevel + 1 },
        css: { currentLevel: cssLevel + 1 },
      };
    } catch (error) {
      console.error('Failed to initialize progression data:', error);
    }
  }

  /**
   * Set the current game mode (html or css)
   */
  public setMode(mode: GameMode): void {
    this.currentMode = mode;
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
   * Start tracking a level (call when level begins)
   */
  public startLevel(): void {
    this.currentLevelStartTime = new Date();
  }

  /**
   * Advance to the next level (called when current level is completed)
   * Creates a database record for the completed level
   */
  public async advanceToNextLevel(): Promise<void> {
    if (!AuthStateManager.isAuthenticated || !AuthStateManager.userEmail) {
      console.warn('Cannot advance level: user not authenticated');
      return;
    }

    const currentLevel = this.data[this.currentMode].currentLevel;
    const finishTime = new Date();
    const startTime = this.currentLevelStartTime || finishTime;

    try {
      // Create a record for the completed level
      await DatabaseService.createLevelRecord({
        mode: this.currentMode,
        level: currentLevel,
        startTime: startTime.toISOString(),
        finishTime: finishTime.toISOString(),
        userEmail: AuthStateManager.userEmail,
        isLatestRun: true,
      });

      // Advance to next level in memory
      this.data[this.currentMode].currentLevel++;

      // Reset start time for next level
      this.currentLevelStartTime = null;
    } catch (error) {
      console.error('Failed to advance level:', error);
    }
  }

  /**
   * Reset progress back to level 1 for the active mode (New Game)
   * Marks all existing records as old (not latest run)
   */
  public async resetProgress(): Promise<void> {
    if (!AuthStateManager.isAuthenticated || !AuthStateManager.userEmail) {
      console.warn('Cannot reset progress: user not authenticated');
      return;
    }

    try {
      // Mark all existing records as old
      await DatabaseService.markAllRecordsAsOld(
        AuthStateManager.userEmail,
        this.currentMode
      );

      // Reset in-memory data
      this.data[this.currentMode] = {
        currentLevel: 1,
      };

      // Reset start time
      this.currentLevelStartTime = null;
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }

  /**
   * Reset progress for a specific mode
   * Marks all existing records as old (not latest run)
   */
  public async resetProgressForMode(mode: GameMode): Promise<void> {
    if (!AuthStateManager.isAuthenticated || !AuthStateManager.userEmail) {
      console.warn('Cannot reset progress: user not authenticated');
      return;
    }

    try {
      // Mark all existing records as old
      await DatabaseService.markAllRecordsAsOld(
        AuthStateManager.userEmail,
        mode
      );

      // Reset in-memory data
      this.data[mode] = {
        currentLevel: 1,
      };

      // Reset start time if resetting current mode
      if (mode === this.currentMode) {
        this.currentLevelStartTime = null;
      }
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }

  /**
   * Set current level directly (useful for testing or skipping)
   */
  public setCurrentLevel(level: number): void {
    if (level < 1) {
      throw new Error('Level must be at least 1');
    }
    this.data[this.currentMode].currentLevel = level;
  }
}
