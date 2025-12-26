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
} from '@game/scenes';
import { LevelProgressionManager } from '@game/progression';

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
  private viewport = new Vector(512, 384);
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

    this.renderer = new CanvasRenderer(canvasElement, zoom);

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
    dbgr.enableRenderGraph = true;

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

    // Create level selection menu with Continue/New Game
    const createLevelsMenu = () => {
      const levelMenuItems = [];
      const currentLevel = progression.getCurrentLevel();
      const totalLevels = LEVELS.levels.length;
      const allLevelsComplete = currentLevel > totalLevels;

      // Show "All Levels Complete" or "Continue" based on progress
      if (allLevelsComplete) {
        levelMenuItems.push({
          label: 'All Levels Complete!',
          // No action - will display as text instead of button
        });
      } else if (progression.hasSavedProgress()) {
        levelMenuItems.push({
          label: `Continue - Level ${currentLevel}`,
          action: () => {
            loadLevel(currentLevel);
          },
        });
      }

      // Always show "New Game" (or "Start Game" if no progress)
      levelMenuItems.push({
        label: progression.hasSavedProgress() ? 'New Game' : 'Start Game',
        action: () => {
          progression.resetProgress();
          loadLevel(1);
        },
      });

      return new MainMenuScene(levelMenuItems, () => {
        engine.loadScene(mainMenuScene);
      });
    };

    // Helper function to load a level with proper callbacks
    const loadLevel = (levelId: number) => {
      const currentLevelIndex = LEVELS.levels.findIndex(l => l.id === levelId);
      const hasNextLevel = currentLevelIndex < LEVELS.levels.length - 1;

      engine.loadScene(
        new GameLevelScene(
          levelId,
          () => {
            // onExit: return to levels menu (recreate to show updated progression)
            engine.loadScene(createLevelsMenu());
          },
          () => {
            if (hasNextLevel) {
              const nextLevel = LEVELS.levels[currentLevelIndex + 1];
              loadLevel(nextLevel.id);
            } else {
              // Last level completed, return to menu
              engine.loadScene(createLevelsMenu());
            }
          },
          hasNextLevel
        )
      );
    };

    // Create main menu scene
    const mainMenuScene = new MainMenuScene([
      {
        label: 'HTML Mode',
        action: () => {
          // Recreate levels menu each time to show current progression state
          engine.loadScene(createLevelsMenu());
        },
      },
    ]);

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
