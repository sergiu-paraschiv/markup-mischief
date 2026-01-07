import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { Engine } from '@engine';
import { GlobalContext, Vector } from '@engine/core';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { PhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import {
  LoadingScene,
  MainMenuScene,
  GameLevelScene,
  LEVELS,
  type MenuItem,
  LoginScene,
  RegisterScene,
} from '@game/scenes';
import { LevelProgressionManager, GameMode } from '@game/progression';
import { AuthStateManager } from '@game/services';

import ASSETS from '../assets.json';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('game') gameElement: ElementRef<HTMLElement> | undefined;
  @ViewChild('canvas') canvasElement: ElementRef<HTMLCanvasElement> | undefined;

  private renderer?: CanvasRenderer;
  private viewport = new Vector(768, 512);
  private resizeListener?: () => void;

  constructor() {
    GlobalContext.set('viewport', this.viewport);
  }

  async ngAfterViewInit(): Promise<void> {
    const gameElement = this.gameElement?.nativeElement;
    const canvasElement = this.canvasElement?.nativeElement;
    if (!gameElement) {
      throw new Error('Game element not found!');
    }
    if (!canvasElement) {
      throw new Error('Game canvas not found!');
    }

    this.resizeListener = () => this.onResize(gameElement);
    window.addEventListener('resize', this.resizeListener);

    // Calculate initial zoom
    const zoom = this.calculateZoom(gameElement);

    this.renderer = new CanvasRenderer(canvasElement, gameElement, zoom);

    const engine = new Engine(
      this.viewport,
      this.renderer,
      new PhysicsSimulation(),
      [
        new Keyboard(document.documentElement),
        new Mouse(
          canvasElement,
          this.renderer.globalToLocalPoint.bind(this.renderer)
        ),
      ]
    );

    const dbgr = new Debugger(gameElement);
    dbgr.attachTo(engine);
    // dbgr.enableGridLines = true;
    // dbgr.enablePhysicsDebugLines = true;
    // dbgr.enableHoverHighlight = true;
    // dbgr.enableFlexDebugLines = true;
    // dbgr.enableRenderGraph = true;

    engine.start(120, 120);

    const loadingScene = new LoadingScene(
      ASSETS.loading,
      ASSETS.chars['Chars']
    );
    engine.loadScene(loadingScene);

    await loadingScene.run();
    await loadingScene.loadAssets(ASSETS.dynamic, ASSETS.chars);

    // Get progression manager
    const progression = LevelProgressionManager.getInstance();

    // Create level selection menu with Continue/New Game for a specific mode
    const createLevelsMenu = (mode: GameMode) => {
      // Set the mode in progression manager
      progression.setMode(mode);

      const levelMenuItems: MenuItem[] = [];
      const currentLevel = progression.getCurrentLevel();
      const levels = mode === 'html' ? LEVELS.htmlLevels : LEVELS.cssLevels;
      const totalLevels = levels.length;
      const allLevelsComplete = currentLevel > totalLevels;

      // Show "All Levels Complete" or "Continue" based on progress
      if (allLevelsComplete) {
        levelMenuItems.push({
          type: 'text',
          text: 'All Levels Complete!',
        });
      } else if (progression.hasSavedProgress()) {
        levelMenuItems.push({
          type: 'button',
          label: `Continue - Level ${currentLevel}`,
          action: () => {
            loadLevel(currentLevel, mode);
          },
        });
      }

      // Always show "New Game" (or "Start Game" if no progress)
      levelMenuItems.push({
        type: 'button',
        label: progression.hasSavedProgress() ? 'New Game' : 'Start Game',
        action: async () => {
          await progression.resetProgress();
          loadLevel(1, mode);
        },
      });

      return new MainMenuScene(levelMenuItems, () => {
        engine.loadScene(mainMenuScene);
      });
    };

    // Helper function to load a level with proper callbacks
    const loadLevel = (levelId: number, mode: GameMode) => {
      const levels = mode === 'html' ? LEVELS.htmlLevels : LEVELS.cssLevels;
      const currentLevelIndex = levels.findIndex(l => l.id === levelId);
      const hasNextLevel = currentLevelIndex < levels.length - 1;

      engine.loadScene(
        new GameLevelScene(
          mode,
          levelId,
          () => {
            // onExit: return to levels menu (recreate to show updated progression)
            engine.loadScene(mainMenuScene);
          },
          () => {
            if (hasNextLevel) {
              const nextLevel = levels[currentLevelIndex + 1];
              loadLevel(nextLevel.id, mode);
            } else {
              // Last level completed, return to menu
              engine.loadScene(createLevelsMenu(mode));
            }
          },
          hasNextLevel
        )
      );
    };

    // Create register scene
    const registerScene = new RegisterScene({
      onRegisterSuccess: async () => {
        console.log('Registration successful!');
        // Initialize progression after successful registration
        await progression.initialize();
        // Recreate main menu to show logout button
        engine.loadScene(createMainMenu());
      },
      onLoginRequest: () => {
        console.log('Login requested from register');
        engine.loadScene(loginScene);
      },
      onBack: () => {
        console.log('Back from register');
        engine.loadScene(createMainMenu());
      },
    });

    // Create login scene
    const loginScene = new LoginScene({
      onLoginSuccess: async () => {
        console.log('Login successful!');
        // Initialize progression after successful login
        await progression.initialize();
        // Recreate main menu to show logout button
        engine.loadScene(createMainMenu());
      },
      onRegisterRequest: () => {
        console.log('Register requested from login');
        engine.loadScene(registerScene);
      },
      onBack: () => {
        console.log('Back from login');
        engine.loadScene(createMainMenu());
      },
    });

    // Helper function to create main menu with dynamic auth buttons
    const createMainMenu = () => {
      const menuItems: MenuItem[] = [
        {
          type: 'button',
          label: 'HTML Mode',
          action: () => {
            // Recreate levels menu each time to show current progression state
            engine.loadScene(createLevelsMenu('html'));
          },
        },
        {
          type: 'button',
          label: 'CSS Mode',
          action: () => {
            // Recreate levels menu each time to show current progression state
            engine.loadScene(createLevelsMenu('css'));
          },
        },
      ];

      // Add auth-related buttons based on current auth state
      if (AuthStateManager.isAuthenticated) {
        // User is logged in - show logout button
        menuItems.push({
          type: 'button',
          label: 'Logout',
          variant: 'secondary',
          action: async () => {
            await AuthStateManager.logout();
            console.log('User logged out');
            // Recreate menu to show login/register buttons
            engine.loadScene(createMainMenu());
          },
        });
      } else {
        // User is not logged in - show login and register buttons
        menuItems.push(
          {
            type: 'button',
            label: 'Login',
            variant: 'secondary',
            action: () => {
              engine.loadScene(loginScene);
            },
          },
          {
            type: 'button',
            label: 'Register',
            variant: 'secondary',
            action: () => {
              engine.loadScene(registerScene);
            },
          }
        );
      }

      return new MainMenuScene(menuItems, undefined);
    };

    // Initialize authentication state (check for existing session)
    await AuthStateManager.initialize();

    // Initialize level progression after authentication
    if (AuthStateManager.isAuthenticated) {
      await progression.initialize();
      console.log(
        'User already logged in:',
        AuthStateManager.currentUser?.email
      );
    } else {
      console.log('No active session');
    }

    // Create and load main menu scene
    // The menu will show logout if authenticated, or login/register if not
    const mainMenuScene = createMainMenu();

    engine.loadScene(mainMenuScene);
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private calculateZoom(gameElement: HTMLElement): number {
    const containerWidth = gameElement.clientWidth;
    const containerHeight = gameElement.clientHeight;

    const zoomX = containerWidth / this.viewport.width;
    const zoomY = containerHeight / this.viewport.height;

    return Math.min(zoomX, zoomY);
  }

  private onResize(gameElement: HTMLElement): void {
    if (!this.renderer) return;

    const newZoom = this.calculateZoom(gameElement);

    this.renderer.setZoom(newZoom);
    this.renderer.setViewport(this.viewport);
  }
}
