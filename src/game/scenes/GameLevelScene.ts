import { Query, Scene, Vector, Event, GlobalContext } from '@engine/core';
import { SpriteMash, SpriteMashData, Node2D } from '@engine/elements';
import { StaticBody } from '@engine/physics';
import {
  BOARD_DATA,
  PinkStar,
  Character,
  CharacterDropEvent,
  CharacterGrabEvent,
  Pointing,
  Tag,
  Wall,
  MainMenu,
  MenuItem,
  LayoutFlex,
  Button,
  Text,
} from '@game/entities';
import { TickEvent } from '@engine/renderer';
import { KeyboardInputEvent, KeyAction } from '@engine/input';
import { LevelData, LevelsData, positionToVector } from './LevelData';
import LEVELS_DATA from './levels.json';

export default class GameLevelScene extends Scene {
  private currentLevel: LevelData;
  private onExit?: () => void;
  private onWin?: () => void;
  private pauseMenu?: Node2D;
  private winMenu?: Node2D;
  private menuButton?: Button;
  private levelNameText?: Text;
  private uiLayout?: LayoutFlex;
  private isPaused = false;
  private hasWon = false;

  constructor(levelId = 1, onExit?: () => void, onWin?: () => void) {
    super();

    const levelsData = LEVELS_DATA as LevelsData;
    const level = levelsData.levels.find(l => l.id === levelId);

    if (!level) {
      throw new Error(`Level with id ${levelId} not found`);
    }

    this.currentLevel = level;
    this.onExit = onExit;
    this.onWin = onWin;

    // Listen for Escape key to toggle pause menu
    this.on(KeyboardInputEvent, this.handleKeyboardInput.bind(this));

    this.run();
  }

  private handleKeyboardInput(event: Event): void {
    if (!(event instanceof KeyboardInputEvent)) return;

    if (event.action === KeyAction.DOWN && event.key === 'Escape') {
      if (this.isPaused) {
        this.hidePauseMenu();
      } else {
        this.showPauseMenu();
      }
    }
  }

  private showPauseMenu(): void {
    if (this.isPaused) return;

    this.isPaused = true;

    // Hide UI layout
    if (this.uiLayout) {
      this.uiLayout.isVisible = false;
    }

    const viewport = GlobalContext.get<Vector>('viewport');

    // Create semi-transparent overlay
    const overlay = new Node2D();
    overlay.fillColor = 'rgba(0, 0, 0, 0.5)';

    // Create pause menu
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

    // Create layout to center the menu
    const menuLayout = new LayoutFlex(new Vector(0, 0), viewport);
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.addChild(menu);

    this.pauseMenu = menuLayout;
    this.addChild(this.pauseMenu);
  }

  private hidePauseMenu(): void {
    if (!this.isPaused || !this.pauseMenu) return;

    this.isPaused = false;
    this.removeChild(this.pauseMenu);
    this.pauseMenu = undefined;

    // Show UI layout again
    if (this.uiLayout) {
      this.uiLayout.isVisible = true;
    }
  }

  private showWinMenu(): void {
    if (this.hasWon) return;

    this.hasWon = true;

    // Hide UI layout
    if (this.uiLayout) {
      this.uiLayout.isVisible = false;
    }

    const viewport = GlobalContext.get<Vector>('viewport');

    // Create semi-transparent overlay
    const overlay = new Node2D();
    overlay.fillColor = 'rgba(0, 0, 0, 0.5)';

    const buttons: MenuItem[] = [];

    // Add Next level button to trigger onWin callback
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

    // Add Exit button
    buttons.push({
      label: 'Exit',
      action: () => {
        if (this.onExit) {
          this.onExit();
        }
      },
    });

    // Create win menu with celebration message
    const menu = new MainMenu(new Vector(0, 0), buttons);

    // Create layout to center the menu
    const menuLayout = new LayoutFlex(new Vector(0, 0), viewport);
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.addChild(menu);

    this.winMenu = menuLayout;
    this.addChild(this.winMenu);
  }

  private async run() {
    function makeEdgeWall(position: Vector, size: Vector) {
      const body = new StaticBody(position);
      body.addChild(new Wall(position, size));

      return body;
    }

    function makePlatformWall(position: Vector, size: Vector) {
      const body = new StaticBody(position);
      body.addChild(new Wall(position, size));

      body.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Character && dropping) {
          return false;
        }

        if (collider instanceof Character && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return body;
    }

    function makeTagTile(position: Vector, text: string) {
      const tag = new Tag(position, text);

      tag.filterCollisionFn = ({ collider, velocity }) => {
        if (collider instanceof Character && dropping) {
          return false;
        }

        if (collider instanceof Character && velocity.y <= 0) {
          return false;
        }

        return true;
      };

      return tag;
    }

    let dropping = false;
    let grabbedTag: Tag | undefined;

    const board = SpriteMash.fromData(BOARD_DATA as SpriteMashData);
    this.addChild(board);
    this.addChild(makeEdgeWall(new Vector(0, 0), new Vector(32, 32 * 12)));
    this.addChild(
      makeEdgeWall(new Vector(32 * 15, 0), new Vector(32, 32 * 12))
    );
    this.addChild(makeEdgeWall(new Vector(32, 0), new Vector(32 * 14, 32)));
    this.addChild(
      makeEdgeWall(new Vector(32, 32 * 11), new Vector(32 * 14, 32))
    );
    this.addChild(
      makeEdgeWall(new Vector(32 * 11, 32 * 9), new Vector(32 * 4, 32 * 2))
    );

    for (let i = 6; i <= 10; i += 1) {
      this.addChild(
        makePlatformWall(new Vector(32 * 1, 2 + 32 * i), new Vector(32 * 9, 1))
      );
    }

    this.addChild(
      makePlatformWall(new Vector(32 * 10 + 24, 2 + 32 * 8), new Vector(22, 1))
    );

    this.addChild(
      makePlatformWall(new Vector(32 * 13 + 24, 2 + 32 * 7), new Vector(22, 1))
    );

    this.addChild(
      makePlatformWall(new Vector(32 * 6 + 24, 2 + 32 * 4), new Vector(22, 1))
    );

    // Spawn player from level data
    const player = new PinkStar(
      positionToVector(this.currentLevel.playerStart)
    );
    this.addChild(player);
    // Add ghost at a higher depth so it renders on top of tags
    this.addChild(player.ghost, 1000);

    // Spawn tags from level data
    this.currentLevel.tags.forEach(tagData => {
      this.addChild(
        makeTagTile(positionToVector(tagData.position), tagData.text)
      );
    });

    this.on(CharacterDropEvent, event => {
      if (this.isPaused || this.hasWon) return;
      dropping = event.start;
    });

    this.on(CharacterGrabEvent, () => {
      if (this.isPaused || this.hasWon) return;
      if (grabbedTag) {
        grabbedTag = undefined;
      } else {
        const tag = player.checkFutureIntersection(
          new Vector(0, 1),
          collider => collider instanceof Tag
        );
        if (tag) {
          grabbedTag = tag as Tag;
        }
      }

      Query.childrenByType(Tag, this).forEach(tag => tag.wakeUp());
    });

    this.on(TickEvent, () => {
      if (this.isPaused) return;

      if (grabbedTag && !this.hasWon) {
        grabbedTag.position = player.position.add(
          new Vector(player.pointing === Pointing.LEFT ? 24 : 38, 8)
        );
      } else if (!this.hasWon) {
        const tags = Query.childrenByType(Tag, this);
        // Sort with tolerance for Y positions (within 16 pixels = same row)
        const rowTolerance = 16;
        tags.sort((a, b) => {
          const yDiff = Math.abs(a.position.y - b.position.y);

          // If Y positions are within tolerance, consider them same row - sort by X
          if (yDiff < rowTolerance) {
            return a.position.x - b.position.x;
          }

          // Different rows - sort by Y
          return a.position.y - b.position.y;
        });

        const html = tags.map(tag => tag.text).join(' ');
        console.log(html, this.currentLevel.solution);
        if (html === this.currentLevel.solution) {
          console.log(
            `Level ${this.currentLevel.id} (${this.currentLevel.name}) completed!`
          );
          this.showWinMenu();
        }
      }

      // Update ghost position to follow player
      player.updateGhostPosition();

      // Check if player is behind any tags
      const overlappingTags = player.checkAllCurrentIntersections(
        collider => collider instanceof Tag
      );

      if (overlappingTags.length > 0) {
        // Create CanvasItem clip masks from overlapping tags
        player.ghostGraphics.clipRegion = overlappingTags.map(tag => {
          const tagBox = tag.collider;

          return {
            item: tag,
            position: new Vector(tagBox.position.x, tagBox.position.y),
          };
        });
        player.ghostGraphics.isVisible = true;
      } else {
        player.ghostGraphics.clipRegion = undefined;
        player.ghostGraphics.isVisible = false;
      }
    });

    // Create UI layout in bottom-right corner
    const viewport = GlobalContext.get<Vector>('viewport');

    // Create level name text
    this.levelNameText = new Text(this.currentLevel.name);
    this.levelNameText.fillColor = '#639d6d';

    // Create menu button
    const menuButtonText = new Text('Menu');
    this.menuButton = new Button(new Vector(0, 0), menuButtonText);
    this.menuButton.action = () => {
      this.showPauseMenu();
    };

    // Create flex layout container
    this.uiLayout = new LayoutFlex(
      new Vector(0, viewport.height - 60),
      new Vector(viewport.width, 60)
    );
    this.uiLayout.flexDirection = 'column';
    this.uiLayout.justifyContent = 'flex-end';
    this.uiLayout.alignItems = 'flex-end';
    this.uiLayout.gap = 4;
    this.uiLayout.padding = new Vector(8, 8);

    // Add elements to layout
    this.uiLayout.addChild(this.levelNameText);
    this.uiLayout.addChild(this.menuButton);

    this.addChild(this.uiLayout);
  }
}
