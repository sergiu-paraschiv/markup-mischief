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
  LayoutFlex,
} from '@game/entities';
import { TickEvent } from '@engine/renderer';
import { KeyboardInputEvent, KeyAction } from '@engine/input';
import { LevelData, LevelsData, positionToVector } from './LevelData';
import LEVELS_DATA from './levels.json';

export default class GameLevelScene extends Scene {
  private currentLevel: LevelData;
  private onExit?: () => void;
  private pauseMenu?: Node2D;
  private isPaused = false;

  constructor(levelId = 1, onExit?: () => void) {
    super();

    const levelsData = LEVELS_DATA as LevelsData;
    const level = levelsData.levels.find(l => l.id === levelId);

    if (!level) {
      throw new Error(`Level with id ${levelId} not found`);
    }

    this.currentLevel = level;
    this.onExit = onExit;

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
      dropping = event.start;
    });

    this.on(CharacterGrabEvent, () => {
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
      if (grabbedTag) {
        grabbedTag.position = player.position.add(
          new Vector(player.pointing === Pointing.LEFT ? 24 : 38, 8)
        );
      } else {
        const tags = Query.childrenByType(Tag, this);
        tags.sort((a, b) => {
          if (a.position.y > b.position.y) {
            return 1;
          } else if (a.position.y < b.position.y) {
            return -1;
          }

          if (a.position.x > b.position.x) {
            return 1;
          } else if (a.position.x < b.position.x) {
            return -1;
          }

          return 0;
        });

        const html = tags.map(tag => tag.text).join(' ');
        if (html === this.currentLevel.solution) {
          // TODO: WIN!
          console.log(
            `Level ${this.currentLevel.id} (${this.currentLevel.name}) completed!`
          );
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
  }
}
