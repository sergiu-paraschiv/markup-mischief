import { Query } from 'appwrite';
import { getAppwriteDatabases, APPWRITE_CONFIG } from './AppwriteConfig';

/**
 * Known setting keys in the database
 */
export const SETTING_KEYS = {
  REGISTRATION_ENABLED: 'registrationEnabled',
  PLAY_ENABLED: 'playEnabled',
} as const;

/**
 * SettingsService - Manages app-wide settings from Appwrite database
 * Singleton pattern with in-memory caching
 */
class SettingsServiceSingleton {
  private static instance: SettingsServiceSingleton;
  private databases = getAppwriteDatabases();
  private databaseId = APPWRITE_CONFIG.databaseId;
  private collectionId = APPWRITE_CONFIG.collections.settings;
  private cache = new Map<string, string | null>();
  private isInitialized = false;

  private constructor() {
    /* empty */
  }

  public static getInstance(): SettingsServiceSingleton {
    if (!SettingsServiceSingleton.instance) {
      SettingsServiceSingleton.instance = new SettingsServiceSingleton();
    }
    return SettingsServiceSingleton.instance;
  }

  /**
   * Initialize settings by fetching all settings from database
   * Should be called once on app startup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const response = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [Query.limit(100)], // Get all settings (max 100)
      });

      // Cache all settings
      response.documents.forEach(doc => {
        this.cache.set(doc['name'] as string, doc['value'] as string | null);
      });

      this.isInitialized = true;
      console.log(
        `Settings loaded: ${response.documents.length} settings cached`
      );
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Continue without settings - use defaults
    }
  }

  /**
   * Get a setting value by key
   * Returns null if setting doesn't exist
   * @param key Setting key
   * @returns Setting value or null
   */
  public async getSetting(key: string): Promise<string | null> {
    // If not initialized, initialize first
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Return from cache if available
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    // Setting not found in cache
    return null;
  }

  /**
   * Get a boolean setting value
   * @param key Setting key
   * @param defaultValue Default value if setting doesn't exist
   * @returns Boolean value
   */
  public async getBooleanSetting(
    key: string,
    defaultValue = false
  ): Promise<boolean> {
    const value = await this.getSetting(key);

    if (value === null) {
      return defaultValue;
    }

    // Handle various truthy representations
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }

  /**
   * Check if registration is enabled
   * @returns True if registration is enabled
   */
  public async isRegistrationEnabled(): Promise<boolean> {
    return this.getBooleanSetting(SETTING_KEYS.REGISTRATION_ENABLED, false);
  }

  public async isPlayEnabled(): Promise<boolean> {
    return this.getBooleanSetting(SETTING_KEYS.PLAY_ENABLED, false);
  }

  /**
   * Refresh a specific setting from the database
   * Useful for getting real-time updates without full re-initialization
   * @param key Setting key
   */
  public async refreshSetting(key: string): Promise<void> {
    try {
      const response = await this.databases.listDocuments({
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        queries: [Query.equal('name', key), Query.limit(1)],
      });

      if (response.documents.length > 0) {
        this.cache.set(key, response.documents[0]['value'] as string | null);
      } else {
        this.cache.delete(key);
      }
    } catch (error) {
      console.error(`Failed to refresh setting ${key}:`, error);
    }
  }

  /**
   * Refresh all settings from database
   * Call this to get the latest settings without restarting the app
   */
  public async refreshAll(): Promise<void> {
    this.cache.clear();
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Clear cached settings
   * Useful for testing or forcing a refresh
   */
  public clearCache(): void {
    this.cache.clear();
    this.isInitialized = false;
  }
}

/**
 * Export singleton instance
 */
export const SettingsService = SettingsServiceSingleton.getInstance();
