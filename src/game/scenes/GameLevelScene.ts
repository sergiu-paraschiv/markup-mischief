import { Scene, Event } from '@engine/core';
import {
  CharacterDropEvent,
  CharacterGrabEvent,
  PinkStar,
} from '@game/entities';
import { TickEvent } from '@engine/renderer';
import { KeyboardInputEvent, KeyAction } from '@engine/input';
import { LevelData, LevelsData } from './level/LevelData';
import LEVELS_DATA from './level/levels.json';
import { LevelBuilder } from './level/LevelBuilder';
import { WinConditionChecker } from './level/WinConditionChecker';
import { PlayerTagInteraction } from './level/PlayerTagInteraction';
import { GameUIManager } from './level/GameUIManager';
import { LevelProgressionManager } from '@game/progression';

/**
 * Main game level scene
 * Orchestrates level building, UI, player-tag interactions, and win conditions
 */
export default class GameLevelScene extends Scene {
  private currentLevel: LevelData;
  private onExit?: () => void;
  private onWin?: () => void;
  private hasNextLevel: boolean;
  private dropping = false;
  private hasWon = false;

  private player: PinkStar | undefined;
  private uiManager: GameUIManager | undefined;
  private winChecker: WinConditionChecker | undefined;
  private tagInteraction: PlayerTagInteraction | undefined;

  constructor(
    levelId = 1,
    onExit?: () => void,
    onWin?: () => void,
    hasNextLevel = false
  ) {
    super();

    const levelsData = LEVELS_DATA as LevelsData;
    const level = levelsData.levels.find(l => l.id === levelId);

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
    const levelBuilder = new LevelBuilder(
      this,
      this.currentLevel,
      () => this.dropping
    );
    this.player = levelBuilder.build();

    this.uiManager = new GameUIManager(
      this,
      this.currentLevel,
      this.onExit,
      this.onWin,
      this.hasNextLevel
    );
    this.uiManager.initialize();

    this.tagInteraction = new PlayerTagInteraction(this, this.player);

    this.winChecker = new WinConditionChecker(this, this.currentLevel);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on(KeyboardInputEvent, this.handleKeyboardInput.bind(this));

    this.on(CharacterDropEvent, event => {
      this.dropping = event.start;
    });

    this.on(CharacterGrabEvent, () => {
      this.tagInteraction?.handleGrab();
    });

    this.on(TickEvent, () => {
      if (!this.winChecker) return;

      this.tagInteraction?.update(this.hasWon);

      if (!this.hasWon) {
        // Get current HTML for preview
        const html = this.winChecker.getCurrentHtml();
        this.uiManager?.updateHtmlPreview(html, this.winChecker.getSolution());

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
  }
}
