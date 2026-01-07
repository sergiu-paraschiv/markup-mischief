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
export type ButtonVariant = 'primary' | 'secondary' | 'text';

const OUTLINE_DEFAULT = 'rgba(0, 0, 0, 0.3)';
const OUTLINE_HOVER = 'rgba(255, 255, 255, 0.3)';
const OUTLINE_FOCUSED = 'rgba(100, 150, 255, 0.6)';
const OUTLINE_DISABLED = 'rgba(0, 0, 0, 0.1)';
const TEXT_DISABLED = 'rgba(128, 128, 128, 0.5)';

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
  private outline: Layout3Slice | Sprite | undefined;
  private background: Layout3Slice | Sprite | undefined;
  private hoverBackground: Layout3Slice | Sprite | undefined;
  private textComponent: Text;
  private textDefaultPosition: Vector;
  private variant: ButtonVariant;
  public readonly mouseInteraction: MouseInteractionManager;
  public action: ActionFn | undefined = undefined;
  private _isFocused = false;
  private _isHovered = false;
  private _isDisabled = false;
  private underline: Layout3Slice | undefined;
  private buttonElement: HTMLButtonElement;

  constructor(
    initialPosition: Vector,
    textComponent: Text,
    variant: ButtonVariant = 'primary'
  ) {
    super(initialPosition);
    this.textComponent = textComponent;
    this.variant = variant;

    const assets = GlobalContext.get<AssetsMap>('assets');

    // Text variant - no background, just text with underline on hover
    if (variant === 'text') {
      const tilemap = assets['Chars'].tilemaps['Chars'];
      textComponent.position = new Vector(0, 0);
      this.textDefaultPosition = new Vector(0, 0);
      this.addChild(textComponent);

      // Create underline using 3-slice (tiles 282, 283, 284)
      this.underline = new Layout3Slice(
        textComponent.width,
        tilemap.get(90),
        tilemap.get(90),
        tilemap.get(90)
      );
      this.underline.position = new Vector(0, textComponent.height + 2);
      this.underline.isVisible = false;
      this.addChild(this.underline);
    } else {
      // Primary/Secondary variants - with background
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
      this.outline.position = new Vector(
        -outlineThicknessX,
        -outlineThicknessY
      );
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
    }

    // Create HTML button element
    this.buttonElement = document.createElement('button');
    this.attachedDOM = this.buttonElement;
    this.setupButtonElement();

    // Set up mouse interaction
    this.mouseInteraction = new MouseInteractionManager(this);

    this.mouseInteraction.on(MouseEnterEvent, this.handleMouseEnter.bind(this));
    this.mouseInteraction.on(MouseLeaveEvent, this.handleMouseLeave.bind(this));
    this.mouseInteraction.on(MouseClickEvent, this.handleMouseClick.bind(this));
  }

  private setupButtonElement(): void {
    const button = this.buttonElement;

    // Mark as interactive element to exclude from masking system
    button.setAttribute('data-interactive', 'true');

    // Basic styling - transparent overlay
    button.style.position = 'absolute';
    button.style.left = '0';
    button.style.top = '0';
    button.style.width = `${this.width}px`;
    button.style.height = `${this.height}px`;
    button.style.border = 'none';
    button.style.outline = 'none';
    button.style.background = 'transparent';
    button.style.cursor = 'pointer';
    button.style.padding = '0';
    button.style.margin = '0';
    button.style.zIndex = '1000';

    // Prevent default browser styling
    button.style.appearance = 'none';
    button.style.webkitAppearance = 'none';

    // Event listeners
    button.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    button.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    button.addEventListener('click', this.handleMouseClick.bind(this));
    button.addEventListener('focus', () => this.setFocused(true));
    button.addEventListener('blur', () => this.setFocused(false));
  }

  private handleMouseEnter(): void {
    if (this._isDisabled) return;
    this._isHovered = true;
    this.updateVisualState();
  }

  private handleMouseLeave(): void {
    if (this._isDisabled) return;
    this._isHovered = false;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    if (this._isDisabled) {
      // Disabled state
      if (this.outline && this.background && this.hoverBackground) {
        this.outline.fillColor = OUTLINE_DISABLED;
        this.background.isVisible = true;
        this.hoverBackground.isVisible = false;
      }
      if (this.underline) {
        this.underline.isVisible = false;
      }
      this.textComponent.position = this.textDefaultPosition;
      this.textComponent.fillColor = TEXT_DISABLED;
      return;
    }

    // Reset text color when not disabled
    this.textComponent.fillColor = undefined;

    const isActive = this._isFocused || this._isHovered;

    if (this.variant === 'text') {
      // Text variant: show underline on hover/focus
      if (this.underline) {
        this.underline.isVisible = isActive;
      }
      this.textComponent.position = this.textDefaultPosition;
    } else {
      // Primary/Secondary variants: move text down and swap background
      if (isActive) {
        if (this.outline && this.background && this.hoverBackground) {
          this.outline.fillColor = this._isFocused
            ? OUTLINE_FOCUSED
            : OUTLINE_HOVER;
          this.background.isVisible = false;
          this.hoverBackground.isVisible = true;
        }
        this.textComponent.position = new Vector(
          this.textDefaultPosition.x,
          this.textDefaultPosition.y + 1
        );
      } else {
        if (this.outline && this.background && this.hoverBackground) {
          this.outline.fillColor = OUTLINE_DEFAULT;
          this.background.isVisible = true;
          this.hoverBackground.isVisible = false;
        }
        this.textComponent.position = this.textDefaultPosition;
      }
    }
  }

  public setFocused(focused: boolean): void {
    this._isFocused = focused;
    this.updateVisualState();
  }

  public get isFocused(): boolean {
    return this._isFocused;
  }

  public setDisabled(disabled: boolean): void {
    this._isDisabled = disabled;
    this.buttonElement.disabled = disabled;
    if (disabled) {
      this.buttonElement.style.cursor = 'not-allowed';
    } else {
      this.buttonElement.style.cursor = 'pointer';
    }
    this.updateVisualState();
  }

  public get isDisabled(): boolean {
    return this._isDisabled;
  }

  public activate(): void {
    if (this._isDisabled) return;
    if (this.action) {
      this.action();
    }
  }

  private handleMouseClick(): void {
    if (this._isDisabled) return;
    this.activate();
  }

  /**
   * Get the underlying HTML button element
   * Useful for nesting in a parent form element
   */
  public getButtonElement(): HTMLButtonElement {
    return this.buttonElement;
  }

  /**
   * Set the button type (button, submit, reset)
   */
  public setButtonType(type: 'button' | 'submit' | 'reset'): void {
    this.buttonElement.type = type;
  }

  override get width() {
    return this.background?.width || this.textComponent.width;
  }

  override get height() {
    return this.background?.height || this.textComponent.height;
  }
}
