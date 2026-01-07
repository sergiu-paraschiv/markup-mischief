import { Models } from 'appwrite';
import { EventEmitter, Event } from '@engine/core';
import { AuthService } from '../appwrite/AuthService';

/**
 * Authentication state change event
 */
export class AuthStateChangeEvent extends Event {
  constructor(
    public readonly isAuthenticated: boolean,
    public readonly user: Models.User<Models.Preferences> | null
  ) {
    super();
  }
}

/**
 * AuthStateManager - Global authentication state management
 * Singleton pattern with EventEmitter for reactive state updates
 */
class AuthStateManagerSingleton extends EventEmitter {
  private static instance: AuthStateManagerSingleton;
  private _isAuthenticated = false;
  private _currentUser: Models.User<Models.Preferences> | null = null;
  private _isInitialized = false;

  private constructor() {
    super();
  }

  public static getInstance(): AuthStateManagerSingleton {
    if (!AuthStateManagerSingleton.instance) {
      AuthStateManagerSingleton.instance = new AuthStateManagerSingleton();
    }
    return AuthStateManagerSingleton.instance;
  }

  /**
   * Initialize auth state by checking for existing session
   * Call this on app startup
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    const sessionCheck = await AuthService.checkSession();
    this.updateAuthState(
      sessionCheck.isAuthenticated,
      sessionCheck.user || null
    );
    this._isInitialized = true;
  }

  /**
   * Login user with email and password
   */
  public async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const result = await AuthService.login(email, password);

    if (result.success && result.user) {
      this.updateAuthState(true, result.user);
      return { success: true };
    }

    return { success: false, error: result.error };
  }

  /**
   * Register new user with email and password
   */
  public async register(
    email: string,
    password: string,
    name?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const result = await AuthService.register(email, password, name);

    if (result.success && result.user) {
      this.updateAuthState(true, result.user);
      return { success: true };
    }

    return { success: false, error: result.error };
  }

  /**
   * Logout current user
   */
  public async logout(): Promise<void> {
    await AuthService.logout();
    this.updateAuthState(false, null);
  }

  /**
   * Get current authentication status
   */
  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  /**
   * Get current user (null if not authenticated)
   */
  public get currentUser(): Models.User<Models.Preferences> | null {
    return this._currentUser;
  }

  /**
   * Get current user email (null if not authenticated)
   */
  public get userEmail(): string | null {
    return this._currentUser?.email || null;
  }

  /**
   * Check if auth state has been initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Update internal auth state and emit event
   */
  private updateAuthState(
    isAuthenticated: boolean,
    user: Models.User<Models.Preferences> | null
  ): void {
    const stateChanged =
      this._isAuthenticated !== isAuthenticated ||
      this._currentUser?.$id !== user?.$id;

    this._isAuthenticated = isAuthenticated;
    this._currentUser = user;

    if (stateChanged) {
      this.handleEvent(new AuthStateChangeEvent(isAuthenticated, user));
    }
  }
}

/**
 * Export singleton instance
 */
export const AuthStateManager = AuthStateManagerSingleton.getInstance();
