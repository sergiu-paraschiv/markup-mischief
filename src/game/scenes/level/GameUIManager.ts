import { GlobalContext, Scene, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Button, HtmlPreview, LayoutFlex, Text } from '@game/entities';
import CharacterPicker from './CharacterPicker';

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
  private onCharacterChange?: () => void;
  private hasNextLevel: boolean;

  constructor(
    scene: Scene,
    levelData: LevelData,
    onExit?: () => void,
    onWin?: () => void,
    hasNextLevel = false,
    onCharacterChange?: () => void
  ) {
    this.scene = scene;
    this.levelData = levelData;
    this.onExit = onExit;
    this.onWin = onWin;
    this.hasNextLevel = hasNextLevel;
    this.onCharacterChange = onCharacterChange;
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
    this.levelNameText = new Text(`Level ${this.levelData.id}`, 0, 'hero');

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
    this.uiLayout.padding = new Vector(8, 0);
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
      new Vector(200, 160),
      ''
    );

    const solutionBoard = new SolutionBoard(new Vector(0, 0), this.htmlPreview);

    this.solutionToggleButtonText = new Text('Show Solution');
    this.solutionToggleButton = new Button(
      new Vector(0, 0),
      this.solutionToggleButtonText,
      'secondary'
    );
    this.solutionToggleButton.translation = new Vector(-4, -24);
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
    this.targetLayout.padding = new Vector(20, 20);
    this.targetLayout.gap = 4;

    this.targetLayout.addChild(solutionBoard);
    this.targetLayout.addChild(this.solutionToggleButton);

    this.scene.addChild(this.targetLayout);
  }

  /**
   * Updates the HTML preview with current or solution HTML (and optionally CSS)
   */
  updateHtmlPreview(
    currentHtml: string,
    solutionHtml: string,
    currentCss?: string,
    solutionCss?: string
  ): void {
    if (!this.htmlPreview) return;

    let displayHtml: string;
    let displayCss = '';

    if (this.isCtrlPressed || this.showSolutionToggle) {
      // Show solution when Ctrl is pressed or toggle is on
      displayHtml = solutionHtml;
      displayCss = solutionCss || '';
    } else {
      // Show current output by default
      displayHtml = currentHtml;
      displayCss = currentCss || '';
    }

    // Pass both HTML and CSS to the preview component
    // The CSS will be injected into the style tag and applied to the HTML
    this.htmlPreview.setHtml(displayHtml, displayCss);
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
        type: 'button',
        label: 'Continue',
        action: () => {
          this.hidePauseMenu();
        },
      },
      {
        type: 'button',
        label: 'Exit',
        action: () => {
          this.hidePauseMenu();
          if (this.onExit) {
            this.onExit();
          }
        },
      },
      {
        type: 'custom',
        element: new CharacterPicker(() => {
          if (this.onCharacterChange) {
            this.onCharacterChange();
          }
        }),
      },
    ]);

    // Create container for character picker and menu
    const pauseContent = new LayoutFlex(
      new Vector(0, 0),
      new Vector(menu.width, menu.height)
    );
    pauseContent.flexDirection = 'column';
    pauseContent.alignItems = 'center';
    pauseContent.addChild(menu);

    const menuLayout = new LayoutFlex(new Vector(0, 0), this.viewport);
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.addChild(pauseContent);

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

    // Show "All Levels Complete!" text if no next level, otherwise "Next level" button
    if (this.hasNextLevel && this.onWin) {
      buttons.push({
        type: 'button',
        label: 'Next level',
        action: () => {
          if (this.onWin) {
            this.onWin();
          }
        },
      });
    } else if (!this.hasNextLevel) {
      buttons.push({
        type: 'text',
        text: 'All Levels Complete!',
      });
    }

    buttons.push({
      type: 'button',
      label: 'Exit',
      action: () => {
        if (this.onExit) {
          this.onExit();
        }
      },
      variant: this.hasNextLevel ? 'secondary' : 'primary',
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
