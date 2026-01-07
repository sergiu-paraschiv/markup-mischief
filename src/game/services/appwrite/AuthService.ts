import { ID, Models, AppwriteException } from 'appwrite';
import { getAppwriteAccount } from './AppwriteConfig';

/**
 * Authentication result types
 */
export interface AuthResult {
  success: boolean;
  user?: Models.User<Models.Preferences>;
  session?: Models.Session;
  error?: string;
}

export interface SessionCheckResult {
  isAuthenticated: boolean;
  user?: Models.User<Models.Preferences>;
  session?: Models.Session;
}

/**
 * AuthService - Handles all authentication operations with Appwrite
 * Singleton pattern for consistent auth state management
 */
class AuthServiceSingleton {
  private static instance: AuthServiceSingleton;
  private account = getAppwriteAccount();

  private constructor() {
    /* empty */
  }

  public static getInstance(): AuthServiceSingleton {
    if (!AuthServiceSingleton.instance) {
      AuthServiceSingleton.instance = new AuthServiceSingleton();
    }
    return AuthServiceSingleton.instance;
  }

  /**
   * Register a new user with email and password
   * @param email User's email address
   * @param password User's password (min 8 characters)
   * @param name Optional user display name
   * @returns AuthResult with user and session data
   */
  public async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResult> {
    try {
      // Create account
      await this.account.create({ userId: ID.unique(), email, password, name });

      // Auto-login after registration
      const loginResult = await this.login(email, password);

      return {
        success: true,
        user: loginResult.user,
        session: loginResult.session,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Login with email and password
   * @param email User's email address
   * @param password User's password
   * @returns AuthResult with user and session data
   */
  public async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Create email session
      const session = await this.account.createEmailPasswordSession({
        email,
        password,
      });

      // Get user details
      const user = await this.account.get();

      return {
        success: true,
        user,
        session,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Logout current user and delete session
   * @returns Success status
   */
  public async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.account.deleteSession({ sessionId: 'current' });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Check if user has an active session
   * @returns SessionCheckResult with authentication status
   */
  public async checkSession(): Promise<SessionCheckResult> {
    try {
      const user = await this.account.get();
      const session = await this.account.getSession({ sessionId: 'current' });

      return {
        isAuthenticated: true,
        user,
        session,
      };
    } catch (error) {
      console.error(error);
      // Not authenticated or session expired
      return {
        isAuthenticated: false,
      };
    }
  }

  /**
   * Get current authenticated user
   * @returns User object or null if not authenticated
   */
  public async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await this.account.get();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /**
   * Parse Appwrite error into user-friendly message
   * @param error AppwriteException or generic error
   * @returns User-friendly error message
   */
  private parseError(error: unknown): string {
    if (error instanceof AppwriteException) {
      switch (error.code) {
        case 400:
        case 401:
          return 'Invalid email or password';
        case 409:
          return 'An account with this email already exists';
        case 429:
          return 'Too many requests. Please try again later';
        default:
          return error.message || 'An error occurred during authentication';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }
}

/**
 * Export singleton instance
 */
export const AuthService = AuthServiceSingleton.getInstance();
