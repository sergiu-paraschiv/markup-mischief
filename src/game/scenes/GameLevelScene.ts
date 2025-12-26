import { Scene, Event } from '@engine/core';
import { CharacterGrabEvent, Character } from '@game/entities';
import { TickEvent } from '@engine/renderer';
import { KeyboardInputEvent, KeyAction } from '@engine/input';
import { LevelData, LevelsData } from './level/LevelData';
import LEVELS_DATA from './level/levels.json';
import { LevelBuilder } from './level/LevelBuilder';
import { WinConditionChecker } from './level/WinConditionChecker';
import { PlayerTagInteraction } from './level/PlayerTagInteraction';
import { GameUIManager } from './level/GameUIManager';
import { LevelProgressionManager, type GameMode } from '@game/progression';

/**
 * Base class for game level scenes
 * Handles common functionality for both HTML and CSS game modes
 */
export default class GameLevelScene extends Scene {
  private currentLevel: LevelData;
  private mode: GameMode;
  private onExit?: () => void;
  private onWin?: () => void;
  private hasNextLevel: boolean;
  private hasWon = false;

  private player1: Character | undefined;
  private player2: Character | undefined;
  private activePlayer: Character | undefined;
  private uiManager: GameUIManager | undefined;
  private winChecker: WinConditionChecker | undefined;
  private tagInteraction: PlayerTagInteraction | undefined;

  constructor(
    mode: GameMode,
    levelId = 1,
    onExit?: () => void,
    onWin?: () => void,
    hasNextLevel = false
  ) {
    super();

    this.mode = mode;

    const levelsData = LEVELS_DATA as LevelsData;
    const levels =
      mode === 'html' ? levelsData.htmlLevels : levelsData.cssLevels;
    const level = levels.find(l => l.id === levelId);

    if (!level) {
      throw new Error(`Level with id ${levelId} not found`);
    }

    this.currentLevel = level;
    this.onExit = onExit;
    this.onWin = onWin;
    this.hasNextLevel = hasNextLevel;

    this.run();
  }

  private async run() {
    const levelBuilder = new LevelBuilder(this, this.currentLevel, this.mode);
    const players = levelBuilder.build();
    this.player1 = players.player1;
    this.player2 = players.player2;

    // Set the active player (player1 by default)
    this.activePlayer = this.player1;

    // In CSS mode with two players, disable player2 initially
    if (this.player2) {
      this.player2.enabled = false;
    }

    this.uiManager = new GameUIManager(
      this,
      this.currentLevel,
      this.onExit,
      this.onWin,
      this.hasNextLevel
    );
    this.uiManager.initialize();

    this.tagInteraction = new PlayerTagInteraction(this, this.activePlayer);

    this.winChecker = new WinConditionChecker(
      this,
      this.currentLevel,
      this.mode
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on(KeyboardInputEvent, this.handleKeyboardInput.bind(this));

    this.on(CharacterGrabEvent, () => {
      this.tagInteraction?.handleGrab();
    });

    this.on(TickEvent, () => {
      if (!this.winChecker) return;

      this.tagInteraction?.update(this.hasWon);

      if (!this.hasWon) {
        // Get current HTML and CSS for preview
        const html = this.winChecker.getCurrentHtml();
        const css = this.winChecker.getCurrentCss();
        this.uiManager?.updateHtmlPreview(
          html,
          this.winChecker.getHtmlSolution(),
          css,
          this.winChecker.getCssSolution()
        );

        // Only check win condition if no tag is currently grabbed
        const isTagGrabbed = this.tagInteraction?.getGrabbedTag() !== undefined;

        if (!isTagGrabbed && this.winChecker.isCorrect()) {
          this.hasWon = true;

          // Advance progression immediately when level is won
          const progression = LevelProgressionManager.getInstance();
          progression.advanceToNextLevel();

          this.uiManager?.showWinMenu();
        }
      }
    });
  }

  private handleKeyboardInput(event: Event): void {
    if (!(event instanceof KeyboardInputEvent)) return;

    if (event.key === 'Control') {
      this.uiManager?.setCtrlPressed(event.action === KeyAction.DOWN);
    }

    if (event.action === KeyAction.DOWN && event.key === 'Escape') {
      this.uiManager?.togglePauseMenu();
    }

    // Handle character switching in CSS mode (Shift key)
    if (
      event.action === KeyAction.DOWN &&
      event.key === 'Shift' &&
      this.player2
    ) {
      this.switchActivePlayer();
    }
  }

  private switchActivePlayer(): void {
    if (!this.player1 || !this.player2) return;

    // Toggle between players
    if (this.activePlayer === this.player1) {
      this.player1.enabled = false;
      this.player2.enabled = true;
      this.activePlayer = this.player2;
    } else {
      this.player2.enabled = false;
      this.player1.enabled = true;
      this.activePlayer = this.player1;
    }

    this.activePlayer.showExclamation();

    // Update tag interaction to use the new active player
    if (this.tagInteraction) {
      this.tagInteraction.setPlayer(this.activePlayer);
    }
  }
}
