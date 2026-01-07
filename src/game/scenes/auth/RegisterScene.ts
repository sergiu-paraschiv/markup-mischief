import { GlobalContext, Scene, Vector } from '@engine/core';
import { FixedSizeLayoutFlex, FormLayout } from '@game/entities';
import { AuthStateManager } from '@game/services';
import { SceneLoadedEvent } from '@engine';

export interface RegisterSceneCallbacks {
  onRegisterSuccess: () => void;
  onLoginRequest: () => void;
  onBack?: () => void;
}

export default class RegisterScene extends Scene {
  private formLayout: FormLayout;
  private isLoading = false;

  constructor(callbacks: RegisterSceneCallbacks) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');

    // Create form layout
    this.formLayout = new FormLayout(new Vector(0, 0), {
      title: 'Register',

      inputs: [
        {
          key: 'email',
          placeholder: 'Email',
          type: 'email',
          width: 200,
          name: 'email',
          autocomplete: 'username',
          autofocus: true,
        },
        {
          key: 'password',
          placeholder: 'Password',
          type: 'password',
          width: 200,
          name: 'password',
          autocomplete: 'new-password',
        },
        {
          key: 'confirmPassword',
          placeholder: 'Confirm Password',
          type: 'password',
          width: 200,
          name: 'confirmPassword',
          autocomplete: 'new-password',
        },
      ],
      mainAction: {
        label: 'Register',
        onAction: values =>
          this.handleRegister(values, callbacks.onRegisterSuccess),
      },
      secondaryActions: [
        {
          label: 'Login',
          onAction: callbacks.onLoginRequest,
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

    // Listen for scene loaded event to trigger autofocus
    this.on(SceneLoadedEvent, () => {
      this.formLayout.triggerAutofocus();
    });
  }

  private setupKeyboardShortcuts(): void {
    // Note: Enter key handling could be improved by checking input focus
    // For now, keeping it simple
  }

  private async handleRegister(
    values: Record<string, string>,
    onSuccess: () => void
  ): Promise<void> {
    if (this.isLoading) return;

    const email = values['email'].trim();
    const password = values['password'];
    const confirmPassword = values['confirmPassword'];

    // Basic validation
    if (!email || !password || !confirmPassword) {
      this.showError('All fields are required');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Invalid email address');
      return;
    }

    if (password.length < 8) {
      this.showError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    // Show loading state
    this.isLoading = true;
    this.hideError();
    this.setButtonsEnabled(false);

    try {
      // Attempt registration
      const result = await AuthStateManager.register(email, password);

      if (result.success) {
        // Clear form
        this.formLayout.clearInputs();

        // Call success callback
        onSuccess();
      } else {
        // Show error
        this.formLayout.showError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
