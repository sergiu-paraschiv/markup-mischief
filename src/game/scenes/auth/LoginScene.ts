import { GlobalContext, Scene, Vector } from '@engine/core';
import { FixedSizeLayoutFlex, FormLayout } from '@game/entities';
import { AuthStateManager } from '@game/services';

export interface LoginSceneCallbacks {
  onLoginSuccess: () => void;
  onRegisterRequest: () => void;
  onBack?: () => void;
}

export default class LoginScene extends Scene {
  private formLayout: FormLayout;
  private isLoading = false;

  constructor(callbacks: LoginSceneCallbacks) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');

    // Create form layout
    this.formLayout = new FormLayout(new Vector(0, 0), {
      title: 'Login',

      inputs: [
        {
          key: 'email',
          placeholder: 'Email',
          type: 'email',
          width: 200,
          name: 'email',
          autocomplete: 'username',
        },
        {
          key: 'password',
          placeholder: 'Password',
          type: 'password',
          width: 200,
          name: 'password',
          autocomplete: 'current-password',
        },
      ],
      mainAction: {
        label: 'Login',
        onAction: values => this.handleLogin(values, callbacks.onLoginSuccess),
      },
      secondaryActions: [
        {
          label: 'Register',
          onAction: callbacks.onRegisterRequest,
        },
      ],
      backAction: callbacks.onBack,
    });

    // Center the form on screen
    const mainLayout = new FixedSizeLayoutFlex(new Vector(0, 0), viewport);
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(this.formLayout);

    this.addChild(mainLayout);

    // Handle Enter key to submit (simplified)
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    // Note: Enter key handling could be improved by checking input focus
    // For now, keeping it simple
  }

  private async handleLogin(
    values: Record<string, string>,
    onSuccess: () => void
  ): Promise<void> {
    if (this.isLoading) return;

    const email = values['email'].trim();
    const password = values['password'];

    // Basic validation
    if (!email || !password) {
      this.showError('Enter email and password');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Invalid email address');
      return;
    }

    // Show loading state
    this.isLoading = true;
    this.hideError();
    this.setButtonsEnabled(false);

    try {
      // Attempt login
      const result = await AuthStateManager.login(email, password);

      if (result.success) {
        // Clear form
        this.formLayout.clearInputs();

        // Call success callback
        onSuccess();
      } else {
        // Show error
        this.formLayout.showError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.formLayout.showError('Unexpected error occurred');
    } finally {
      this.isLoading = false;
      this.formLayout.setButtonsEnabled(true);
    }
  }

  private isValidEmail(email: string): boolean {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showError(message: string): void {
    this.formLayout.showError(message);
  }

  private hideError(): void {
    this.formLayout.hideError();
  }

  private setButtonsEnabled(enabled: boolean): void {
    this.formLayout.setButtonsEnabled(enabled);
  }
}
