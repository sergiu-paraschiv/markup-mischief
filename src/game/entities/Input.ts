import { Vector, GlobalContext, Event } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { Node2D } from '@engine/elements';
import Layout3Slice from './Layout3Slice';

/**
 * Input value change event
 */
export class InputChangeEvent extends Event {
  constructor(public readonly value: string) {
    super();
  }
}

/**
 * Input focus event
 */
export class InputFocusEvent extends Event {
  constructor() {
    super();
  }
}

/**
 * Input blur event
 */
export class InputBlurEvent extends Event {
  constructor() {
    super();
  }
}

const OUTLINE_DEFAULT = 'rgba(0, 0, 0, 0.3)';
const OUTLINE_FOCUSED = 'rgba(100, 150, 255, 0.6)';

export interface InputOptions {
  width?: number;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  maxLength?: number;
  name?: string;
  autocomplete?: AutoFill;
}

export default class Input extends Node2D {
  private inputElement: HTMLInputElement;
  private background: Layout3Slice;
  private outline: Layout3Slice;
  private _isFocused = false;
  private _width: number;
  private _height: number;
  private capWidth: number; // Width of left/right caps

  constructor(initialPosition: Vector, options: InputOptions = {}) {
    super(initialPosition);

    const {
      width = 150,
      placeholder = '',
      type = 'text',
      maxLength,
      name,
      autocomplete,
    } = options;

    this._width = width;
    this._height = 16; // Standard input height

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap = assets['Wood and Paper UI'].tilemaps['Wood and Paper'];

    const outlineThicknessX = 1;
    const outlineThicknessY = 1;

    // Get cap width from the tile texture
    const leftCap = tilemap.get(13);
    this.capWidth = leftCap ? leftCap.width : 4; // Default to 4 if not found

    // Create background using 3-slice layout (tiles 13, 14, 15)
    this.background = new Layout3Slice(
      this._width,
      tilemap.get(13), // left
      tilemap.get(15), // middle
      tilemap.get(14) // right
    );

    // Create outline slightly larger
    this.outline = new Layout3Slice(
      this._width + outlineThicknessX * 2,
      tilemap.get(13),
      tilemap.get(15),
      tilemap.get(14)
    );

    // Position outline with desired thickness
    this.outline.position = new Vector(-outlineThicknessX, -outlineThicknessY);
    this.outline.fillColor = OUTLINE_DEFAULT;

    // Scale outline to achieve desired vertical thickness
    const scaleY =
      (this.background.height + outlineThicknessY * 2) / this.outline.height;
    this.outline.scale = new Vector(1, scaleY);

    this.addChild(this.outline);
    this.addChild(this.background);

    // Store actual rendered height from background
    this._height = this.background.height;

    // Create HTML input element
    this.inputElement = document.createElement('input');

    // Mark as interactive element to exclude from masking system
    this.inputElement.setAttribute('data-interactive', 'true');

    // Set attachedDOM so renderer can position it
    this.attachedDOM = this.inputElement;

    // Set up input element
    this.setupInputElement(placeholder, type, maxLength, name, autocomplete);
  }

  private setupInputElement(
    placeholder: string,
    type: string,
    maxLength: number | undefined,
    name: string | undefined,
    autocomplete: AutoFill | undefined
  ): void {
    const input = this.inputElement;

    // Basic attributes
    input.type = type;
    input.placeholder = placeholder;
    if (maxLength) {
      input.maxLength = maxLength;
    }
    if (name) {
      input.name = name;
    }
    if (autocomplete) {
      input.autocomplete = autocomplete;
    }

    // Styling to match game aesthetic
    // Fill the entire Input area, use padding to avoid the caps
    input.style.position = 'absolute';
    input.style.left = '0';
    input.style.top = '0';
    input.style.width = `${this._width}px`;
    input.style.height = `${this._height}px`;
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';
    input.style.fontFamily = 'monospace';
    input.style.fontSize = '8px';
    input.style.color = '#2d2d2d';
    input.style.paddingLeft = `${this.capWidth}px`; // Push text away from left cap
    input.style.paddingRight = `${this.capWidth}px`; // Push text away from right cap
    input.style.paddingTop = '0';
    input.style.paddingBottom = '0';
    input.style.margin = '0';
    input.style.boxSizing = 'border-box';
    input.style.zIndex = '1000';
    input.style.pointerEvents = 'auto'; // Re-enable pointer events for input

    // Placeholder styling
    const placeholderColor = '#888888';
    input.style.setProperty('::placeholder', `color: ${placeholderColor}`);

    // Prevent default browser styling
    input.style.appearance = 'none';
    input.style.webkitAppearance = 'none';

    // Override autofill background color - inject global styles once
    this.injectAutofillStyles();

    // Event listeners
    input.addEventListener('focus', this.handleFocus.bind(this));
    input.addEventListener('blur', this.handleBlur.bind(this));
    input.addEventListener('input', this.handleInput.bind(this));
  }

  private injectAutofillStyles(): void {
    // Only inject the styles once globally
    const styleId = 'input-autofill-override';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: #2d2d2d !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private handleFocus(): void {
    this._isFocused = true;
    this.updateVisualState();
    this.handleEvent(new InputFocusEvent());
  }

  private handleBlur(): void {
    this._isFocused = false;
    this.updateVisualState();
    this.handleEvent(new InputBlurEvent());
  }

  private handleInput(): void {
    this.handleEvent(new InputChangeEvent(this.inputElement.value));
  }

  private updateVisualState(): void {
    if (this._isFocused) {
      this.outline.fillColor = OUTLINE_FOCUSED;
    } else {
      this.outline.fillColor = OUTLINE_DEFAULT;
    }
  }

  /**
   * Get current input value
   */
  public get value(): string {
    return this.inputElement.value;
  }

  /**
   * Set input value
   */
  public set value(newValue: string) {
    this.inputElement.value = newValue;
  }

  /**
   * Focus the input programmatically
   */
  public focus(): void {
    this.inputElement.focus();
  }

  /**
   * Blur the input programmatically
   */
  public blur(): void {
    this.inputElement.blur();
  }

  /**
   * Check if input is currently focused
   */
  public get isFocused(): boolean {
    return this._isFocused;
  }

  /**
   * Clear the input value
   */
  public clear(): void {
    this.inputElement.value = '';
    this.handleEvent(new InputChangeEvent(''));
  }

  /**
   * Get the underlying HTML input element
   * Useful for nesting in a parent form element
   */
  public getInputElement(): HTMLInputElement {
    return this.inputElement;
  }

  override get width(): number {
    return this._width;
  }

  override get height(): number {
    return this._height;
  }
}
