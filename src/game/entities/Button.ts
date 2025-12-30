import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { Node2D, Sprite } from '@engine/elements';
import {
  MouseInteractionManager,
  MouseEnterEvent,
  MouseLeaveEvent,
  MouseClickEvent,
} from '@engine/input';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

type ActionFn = () => void;
export type ButtonVariant = 'primary' | 'secondary';

const OUTLINE_DEFAULT = 'rgba(0, 0, 0, 0.3)';
const OUTLINE_HOVER = 'rgba(255, 255, 255, 0.3)';
const OUTLINE_FOCUSED = 'rgba(100, 150, 255, 0.6)';

const TILE_INDEXES = {
  primary: {
    multiChar: { left: 2, center: 3, right: 4 },
    multiCharHover: { left: 44, center: 45, right: 46 },
    singleChar: 1,
    singleCharHover: 43,
  },
  secondary: {
    multiChar: { left: 6, center: 7, right: 8 },
    multiCharHover: { left: 48, center: 49, right: 50 },
    singleChar: 5,
    singleCharHover: 47,
  },
};

export default class Button extends Node2D {
  private outline: Layout3Slice | Sprite;
  private background: Layout3Slice | Sprite;
  private hoverBackground: Layout3Slice | Sprite;
  private textComponent: Text;
  private textDefaultPosition: Vector;
  public readonly mouseInteraction: MouseInteractionManager;
  public action: ActionFn | undefined = undefined;
  private _isFocused = false;
  private _isHovered = false;

  constructor(
    initialPosition: Vector,
    textComponent: Text,
    variant: ButtonVariant = 'primary'
  ) {
    super(initialPosition);
    this.textComponent = textComponent;

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'];

    const outlineThicknessX = 1;
    const outlineThicknessY = 1;

    const tiles = TILE_INDEXES[variant];

    // Create backgrounds first to get dimensions
    if (textComponent.children.length > 1) {
      const buttonWidth = textComponent.width + 12;

      this.background = new Layout3Slice(
        buttonWidth,
        tilemap.get(tiles.multiChar.left),
        tilemap.get(tiles.multiChar.center),
        tilemap.get(tiles.multiChar.right)
      );

      this.hoverBackground = new Layout3Slice(
        buttonWidth,
        tilemap.get(tiles.multiCharHover.left),
        tilemap.get(tiles.multiCharHover.center),
        tilemap.get(tiles.multiCharHover.right)
      );

      this.outline = new Layout3Slice(
        buttonWidth + outlineThicknessX * 2,
        tilemap.get(tiles.multiChar.left),
        tilemap.get(tiles.multiChar.center),
        tilemap.get(tiles.multiChar.right)
      );

      textComponent.position = new Vector(6, 4);
      this.textDefaultPosition = new Vector(6, 4);
    } else {
      this.background = new Sprite(tilemap.get(tiles.singleChar));

      this.hoverBackground = new Sprite(tilemap.get(tiles.singleCharHover));

      this.outline = new Layout3Slice(
        this.background.width + outlineThicknessX * 2,
        tilemap.get(tiles.multiChar.left),
        tilemap.get(tiles.multiChar.center),
        tilemap.get(tiles.multiChar.right)
      );

      textComponent.position = new Vector(5, 4);
      this.textDefaultPosition = new Vector(5, 4);
    }

    // Position outline with desired thickness
    this.outline.position = new Vector(-outlineThicknessX, -outlineThicknessY);
    this.outline.fillColor = OUTLINE_DEFAULT;

    // Scale outline to achieve desired vertical thickness
    const scaleY =
      (this.background.height + outlineThicknessY * 2) / this.outline.height;
    this.outline.scale = new Vector(1, scaleY);

    this.addChild(this.outline);
    this.addChild(this.background);
    this.addChild(this.hoverBackground);

    // Hide hover background by default
    this.hoverBackground.isVisible = false;

    this.addChild(textComponent);

    // Set up mouse interaction
    this.mouseInteraction = new MouseInteractionManager(this);

    this.mouseInteraction.on(MouseEnterEvent, this.handleMouseEnter.bind(this));
    this.mouseInteraction.on(MouseLeaveEvent, this.handleMouseLeave.bind(this));
    this.mouseInteraction.on(MouseClickEvent, this.handleMouseClick.bind(this));
  }

  private handleMouseEnter(): void {
    this._isHovered = true;
    this.updateVisualState();
  }

  private handleMouseLeave(): void {
    this._isHovered = false;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    const isActive = this._isFocused || this._isHovered;

    if (isActive) {
      this.outline.fillColor = this._isFocused
        ? OUTLINE_FOCUSED
        : OUTLINE_HOVER;
      this.background.isVisible = false;
      this.hoverBackground.isVisible = true;
      this.textComponent.position = new Vector(
        this.textDefaultPosition.x,
        this.textDefaultPosition.y + 1
      );
    } else {
      this.outline.fillColor = OUTLINE_DEFAULT;
      this.background.isVisible = true;
      this.hoverBackground.isVisible = false;
      this.textComponent.position = this.textDefaultPosition;
    }
  }

  public setFocused(focused: boolean): void {
    this._isFocused = focused;
    this.updateVisualState();
  }

  public get isFocused(): boolean {
    return this._isFocused;
  }

  public activate(): void {
    if (this.action) {
      this.action();
    }
  }

  private handleMouseClick(): void {
    this.activate();
  }

  override get width() {
    return this.background.width;
  }

  override get height() {
    return this.background.height;
  }
}
