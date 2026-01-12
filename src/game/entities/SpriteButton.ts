import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import {
  MouseInteractionManager,
  MouseEnterEvent,
  MouseLeaveEvent,
  MouseClickEvent,
} from '@engine/input';

type ActionFn = () => void;
export type ButtonVariant = 'primary' | 'secondary' | 'text';

const OUTLINE_DEFAULT = 'rgba(0, 0, 0, 0.3)';
const OUTLINE_HOVER = 'rgba(255, 255, 255, 0.3)';
const OUTLINE_FOCUSED = 'rgba(100, 150, 255, 0.6)';
const OUTLINE_DISABLED = 'rgba(0, 0, 0, 0.1)';

export default class SpriteButton extends Node2D {
  public readonly mouseInteraction: MouseInteractionManager;
  public action: ActionFn | undefined = undefined;
  protected _isFocused = false;
  protected _isHovered = false;
  protected _isDisabled = false;
  protected buttonElement: HTMLButtonElement;

  constructor(
    initialPosition: Vector,
    protected readonly outline: Node2D | undefined,
    protected readonly background: Node2D | undefined,
    protected readonly hoverBackground: Node2D | undefined
  ) {
    super(initialPosition);

    if (this.outline) {
      this.addChild(this.outline);
    }
    if (this.background) {
      this.addChild(this.background);
    }
    if (this.hoverBackground) {
      this.addChild(this.hoverBackground);
      // Hide hover background by default
      this.hoverBackground.isVisible = false;
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
    button.style.tabSize = '0';

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

  protected updateVisualState(): void {
    if (this._isDisabled) {
      // Disabled state
      if (this.outline) {
        this.outline.fillColor = OUTLINE_DISABLED;
      }
      if (this.background) {
        this.background.isVisible = true;
      }
      if (this.hoverBackground) {
        this.hoverBackground.isVisible = false;
      }
      return;
    }

    const isActive = this._isFocused || this._isHovered;

    if (isActive) {
      if (this.outline) {
        this.outline.fillColor = this._isFocused
          ? OUTLINE_FOCUSED
          : OUTLINE_HOVER;
      }
      if (this.background) {
        this.background.isVisible = false;
      }
      if (this.hoverBackground) {
        this.hoverBackground.isVisible = true;
      }
    } else {
      if (this.outline) {
        this.outline.fillColor = OUTLINE_DEFAULT;
      }
      if (this.background) {
        this.background.isVisible = true;
      }
      if (this.hoverBackground) {
        this.hoverBackground.isVisible = false;
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

  public focus(): void {
    setTimeout(() => {
      this.buttonElement.focus();
    }, 100);
  }

  public blur(): void {
    this.buttonElement.blur();
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
    return this.background?.width || 0;
  }

  override get height() {
    return this.background?.height || 0;
  }
}
