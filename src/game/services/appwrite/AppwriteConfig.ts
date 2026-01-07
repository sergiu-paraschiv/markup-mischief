import { Client, Account, Databases } from 'appwrite';

/**
 * Appwrite Configuration Constants
 */
export const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '695e1e98002f12cc47e7',
  databaseId: '695e1f3c003a73300d66',
  collections: {
    levelProgression: 'level_progression',
  },
} as const;

/**
 * Appwrite Client Singleton
 * Initializes and provides access to Appwrite services
 */
class AppwriteClientSingleton {
  private static instance: AppwriteClientSingleton;
  private client: Client;
  private accountService: Account;
  private databasesService: Databases;

  private constructor() {
    this.client = new Client();
    this.client
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId);

    this.accountService = new Account(this.client);
    this.databasesService = new Databases(this.client);
  }

  public static getInstance(): AppwriteClientSingleton {
    if (!AppwriteClientSingleton.instance) {
      AppwriteClientSingleton.instance = new AppwriteClientSingleton();
    }
    return AppwriteClientSingleton.instance;
  }

  public get account(): Account {
    return this.accountService;
  }

  public get databases(): Databases {
    return this.databasesService;
  }

  public get rawClient(): Client {
    return this.client;
  }
}

/**
 * Export singleton instance getters
 */
export const getAppwriteClient = () =>
  AppwriteClientSingleton.getInstance().rawClient;
export const getAppwriteAccount = () =>
  AppwriteClientSingleton.getInstance().account;
export const getAppwriteDatabases = () =>
  AppwriteClientSingleton.getInstance().databases;
