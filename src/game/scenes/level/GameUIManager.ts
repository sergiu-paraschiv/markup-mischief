import { GlobalContext, Scene, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Button, HtmlPreview, LayoutFlex, Text } from '@game/entities';
import { LevelData } from './LevelData';
import { MENU_DEPTH } from './constants';
import SolutionBoard from './SolutionBoard';
import MainMenu, { MenuItem } from '../menu/MainMenu';

/**
 * Manages all UI elements for the game level
 */
export class GameUIManager {
  private scene: Scene;
  private levelData: LevelData;
  private viewport: Vector;

  // UI Elements
  private uiLayout?: LayoutFlex;
  private menuButton?: Button;
  private levelNameText?: Text;
  private htmlPreview?: HtmlPreview;
  private targetLayout?: LayoutFlex;
  private solutionToggleButton?: Button;
  private solutionToggleButtonText?: Text;
  private pauseMenu?: Node2D;
  private winMenu?: Node2D;

  // State
  private isPaused = false;
  private showSolutionToggle = false;
  private isCtrlPressed = false;

  // Callbacks
  private onExit?: () => void;
  private onWin?: () => void;

  constructor(
    scene: Scene,
    levelData: LevelData,
    onExit?: () => void,
    onWin?: () => void
  ) {
    this.scene = scene;
    this.levelData = levelData;
    this.onExit = onExit;
    this.onWin = onWin;
    this.viewport = GlobalContext.get<Vector>('viewport');
  }

  initialize(): void {
    this.createBottomRightUI();
    this.createTopRightUI();
  }

  /**
   * Creates the UI layout in bottom-right corner (menu button, level name)
   */
  private createBottomRightUI(): void {
    this.levelNameText = new Text(this.levelData.name, 0, 'hero');

    const menuButtonText = new Text('Menu');
    this.menuButton = new Button(new Vector(0, 0), menuButtonText);
    this.menuButton.action = () => {
      this.showPauseMenu();
    };

    this.uiLayout = new LayoutFlex(
      new Vector(0, this.viewport.height - 60),
      new Vector(this.viewport.width, 60)
    );
    this.uiLayout.flexDirection = 'column';
    this.uiLayout.justifyContent = 'flex-end';
    this.uiLayout.alignItems = 'flex-end';
    this.uiLayout.padding = new Vector(8, 8);
    this.uiLayout.gap = 6;

    // Add elements to layout
    this.uiLayout.addChild(this.menuButton);
    this.uiLayout.addChild(this.levelNameText);

    this.scene.addChild(this.uiLayout);
  }

  /**
   * Creates the UI layout in top-right corner (HTML preview, solution toggle)
   */
  private createTopRightUI(): void {
    this.htmlPreview = new HtmlPreview(
      new Vector(0, 0),
      new Vector(100, 100),
      ''
    );

    const solutionBoard = new SolutionBoard(new Vector(0, 0), this.htmlPreview);

    this.solutionToggleButtonText = new Text('Show Solution');
    this.solutionToggleButton = new Button(
      new Vector(0, 0),
      this.solutionToggleButtonText,
      'secondary'
    );
    this.solutionToggleButton.action = () => {
      this.showSolutionToggle = !this.showSolutionToggle;
      // Update button text based on toggle state
      if (this.solutionToggleButtonText) {
        this.solutionToggleButtonText.setText(
          this.showSolutionToggle ? 'Hide Solution' : 'Show Solution'
        );
      }
    };

    this.targetLayout = new LayoutFlex(new Vector(0, 0), this.viewport);
    this.targetLayout.flexDirection = 'column';
    this.targetLayout.justifyContent = 'flex-start';
    this.targetLayout.alignItems = 'flex-end';
    this.targetLayout.padding = new Vector(8, 8);
    this.targetLayout.gap = 4;

    this.targetLayout.addChild(solutionBoard);
    this.targetLayout.addChild(this.solutionToggleButton);

    this.scene.addChild(this.targetLayout);
  }

  /**
   * Updates the HTML preview with current or solution HTML
   */
  updateHtmlPreview(currentHtml: string, solutionHtml: string): void {
    if (!this.htmlPreview) return;

    if (this.isCtrlPressed || this.showSolutionToggle) {
      // Show solution when Ctrl is pressed or toggle is on
      this.htmlPreview.setHtml(solutionHtml);
    } else {
      // Show current output by default
      this.htmlPreview.setHtml(currentHtml);
    }
  }

  /**
   * Handles Ctrl key press/release
   */
  setCtrlPressed(pressed: boolean): void {
    this.isCtrlPressed = pressed;

    if (this.solutionToggleButtonText) {
      if (this.isCtrlPressed) {
        this.solutionToggleButtonText.setText('Hide Solution');
      } else {
        this.solutionToggleButtonText.setText(
          this.showSolutionToggle ? 'Hide Solution' : 'Show Solution'
        );
      }
    }
  }

  /**
   * Shows the pause menu
   */
  showPauseMenu(): void {
    if (this.isPaused) return;

    this.isPaused = true;

    if (this.menuButton) {
      this.menuButton.isVisible = false;
    }

    const menu = new MainMenu(new Vector(0, 0), [
      {
        label: 'Continue',
        action: () => {
          this.hidePauseMenu();
        },
      },
      {
        label: 'Exit',
        action: () => {
          this.hidePauseMenu();
          if (this.onExit) {
            this.onExit();
          }
        },
      },
    ]);

    const menuLayout = new LayoutFlex(new Vector(0, 0), this.viewport);
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.addChild(menu);

    this.pauseMenu = menuLayout;
    this.scene.addChild(this.pauseMenu, MENU_DEPTH);
  }

  /**
   * Hides the pause menu
   */
  hidePauseMenu(): void {
    if (!this.isPaused || !this.pauseMenu) return;

    this.isPaused = false;
    this.scene.removeChild(this.pauseMenu);
    this.pauseMenu = undefined;

    if (this.menuButton) {
      this.menuButton.isVisible = true;
    }
  }

  /**
   * Shows the win menu
   */
  showWinMenu(): void {
    if (this.winMenu) return;

    if (this.menuButton) {
      this.menuButton.isVisible = false;
    }

    const buttons: MenuItem[] = [];

    if (this.onWin) {
      buttons.push({
        label: 'Next level',
        action: () => {
          if (this.onWin) {
            this.onWin();
          }
        },
      });
    }

    buttons.push({
      label: 'Exit',
      action: () => {
        if (this.onExit) {
          this.onExit();
        }
      },
      variant: 'secondary',
    });

    const menu = new MainMenu(new Vector(0, 0), buttons);

    const menuLayout = new LayoutFlex(new Vector(0, 0), this.viewport);
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.addChild(menu);

    this.winMenu = menuLayout;
    this.scene.addChild(this.winMenu, MENU_DEPTH);
  }

  isPauseMenuShown(): boolean {
    return this.isPaused;
  }

  togglePauseMenu(): void {
    if (this.isPaused) {
      this.hidePauseMenu();
    } else {
      this.showPauseMenu();
    }
  }
}
