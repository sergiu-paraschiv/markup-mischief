import { ID, Query, Models } from 'appwrite';
import { getAppwriteDatabases, APPWRITE_CONFIG } from './AppwriteConfig';
import type { GameMode } from '@game/progression';

/**
 * Level progression record structure matching database schema
 */
export interface LevelProgressionRecord {
  $id?: string;
  mode: GameMode;
  level: number;
  startTime: string; // ISO datetime
  finishTime: string; // ISO datetime
  userEmail: string;
  isLatestRun: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

/**
 * DatabaseService - Handles all database operations for level progression
 * Singleton pattern for consistent database access
 */
class DatabaseServiceSingleton {
  private static instance: DatabaseServiceSingleton;
  private databases = getAppwriteDatabases();
  private databaseId = APPWRITE_CONFIG.databaseId;
  private collectionId = APPWRITE_CONFIG.collections.levelProgression;

  private constructor() {
    /* empty */
  }

  public static getInstance(): DatabaseServiceSingleton {
    if (!DatabaseServiceSingleton.instance) {
      DatabaseServiceSingleton.instance = new DatabaseServiceSingleton();
    }
    return DatabaseServiceSingleton.instance;
  }

  /**
   * Create a new level progression record
   * @param record Level progression data
   * @returns Created document
   */
  public async createLevelRecord(
    record: Omit<LevelProgressionRecord, '$id' | '$createdAt' | '$updatedAt'>
  ): Promise<Models.Document> {
    try {
      return await this.databases.createDocument({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        documentId: ID.unique(),
        data: record,
      });
    } catch (error) {
      console.error('Failed to create level record:', error);
      throw error;
    }
  }

  /**
   * Get the highest level reached for a specific user and mode (from latest run only)
   * @param userEmail User's email address
   * @param mode Game mode (html or css)
   * @returns Highest level number reached in current run
   */
  public async getHighestLevelForMode(
    userEmail: string,
    mode: GameMode
  ): Promise<number> {
    try {
      const response = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [
          Query.equal('userEmail', userEmail),
          Query.equal('mode', mode),
          Query.equal('isLatestRun', true),
          Query.orderDesc('level'),
          Query.limit(1),
        ],
      });

      if (response.documents.length > 0) {
        return response.documents[0]['level'] as number;
      }

      return 0; // Default to level 0 if no records found
    } catch (error) {
      console.error('Failed to get highest level:', error);
      return 0; // Fallback to level 0 on error
    }
  }

  /**
   * Get all level records for a specific user and mode (latest run only)
   * @param userEmail User's email address
   * @param mode Game mode (html or css)
   * @returns Array of level progression records from current run
   */
  public async getLevelRecordsForMode(
    userEmail: string,
    mode: GameMode
  ): Promise<Models.Document[]> {
    try {
      const response = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [
          Query.equal('userEmail', userEmail),
          Query.equal('mode', mode),
          Query.equal('isLatestRun', true),
          Query.orderAsc('level'),
        ],
      });

      return response.documents;
    } catch (error) {
      console.error('Failed to get level records:', error);
      return [];
    }
  }

  /**
   * Check if a user has completed a specific level in a mode (in current run)
   * @param userEmail User's email address
   * @param mode Game mode
   * @param level Level number
   * @returns True if level is completed in current run
   */
  public async hasCompletedLevel(
    userEmail: string,
    mode: GameMode,
    level: number
  ): Promise<boolean> {
    try {
      const response = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [
          Query.equal('userEmail', userEmail),
          Query.equal('mode', mode),
          Query.equal('level', level),
          Query.equal('isLatestRun', true),
          Query.limit(1),
        ],
      });

      return response.documents.length > 0;
    } catch (error) {
      console.error('Failed to check level completion:', error);
      return false;
    }
  }

  /**
   * Mark all records for a user and mode as old (not latest run)
   * This is called when the user starts fresh/resets progress
   * @param userEmail User's email address
   * @param mode Game mode
   */
  public async markAllRecordsAsOld(
    userEmail: string,
    mode: GameMode
  ): Promise<void> {
    try {
      const records = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [
          Query.equal('userEmail', userEmail),
          Query.equal('mode', mode),
          Query.equal('isLatestRun', true),
        ],
      });

      // Update all records to mark them as old
      const updatePromises = records.documents.map(record =>
        this.databases.updateDocument({
          databaseId: this.databaseId,
          collectionId: this.collectionId,
          documentId: record.$id,
          data: {
            isLatestRun: false,
          },
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to mark records as old:', error);
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const DatabaseService = DatabaseServiceSingleton.getInstance();
