import { Node2D } from '@engine/elements';

export interface HighResTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  letterSpacing?: number;
}

const DEFAULT_STYLE: Required<HighResTextStyle> = {
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'normal',
  color: '#000000',
  letterSpacing: 0,
};

export default class HighResText extends Node2D {
  private textElement: HTMLDivElement;
  private _text: string;
  private _style: Required<HighResTextStyle>;
  private _width = 0;
  private _height = 0;

  // Character dimensions in game space (matching sprite-based Text component)
  private readonly CHAR_WIDTH = DEFAULT_STYLE.fontSize * 0.6;
  private readonly CHAR_HEIGHT = DEFAULT_STYLE.fontSize;

  constructor(text = '', style: HighResTextStyle = {}) {
    super();

    this._text = text;
    this._style = { ...DEFAULT_STYLE, ...style };

    // Create the DOM element
    this.textElement = document.createElement('div');
    this.attachedDOM = this.textElement;

    // Set up styling
    this.setupDOMElement();

    // Render initial text
    this.setText(text);
  }

  private setupDOMElement(): void {
    const el = this.textElement;

    // Basic setup
    el.style.position = 'absolute';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.userSelect = 'none';
    el.style.overflow = 'hidden';

    // Apply text styling
    // Font size should fit within CHAR_HEIGHT (11px)
    el.style.fontFamily = this._style.fontFamily;
    el.style.fontSize = `${this.CHAR_HEIGHT}px`;
    el.style.fontWeight = this._style.fontWeight;
    el.style.color = this._style.color;
    // el.style.letterSpacing = '0px'; // We control width via char count
    el.style.lineHeight = `${this.CHAR_HEIGHT}px`;
    el.style.margin = '0';
    el.style.padding = '0';

    // Set transform origin for proper scaling
    el.style.transformOrigin = 'top left';
  }

  public setText(text: string): void {
    this._text = text;

    // Clear existing content
    this.textElement.innerHTML = '';

    // Calculate dimensions in game space based on character count
    // Each character is CHAR_WIDTH x CHAR_HEIGHT in game space
    const charCount = text.length;
    this._width = charCount * this.CHAR_WIDTH;
    this._height = this.CHAR_HEIGHT;

    // Create a span for each character with fixed width
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.style.display = 'inline-block';
      span.style.width = `${this.CHAR_WIDTH}px`;
      span.style.height = `${this.CHAR_HEIGHT}px`;
      span.style.textAlign = 'center';
      span.style.lineHeight = `${this.CHAR_HEIGHT}px`;
      span.style.overflow = 'hidden';
      this.textElement.appendChild(span);
    }

    // The DOM element itself should be sized to game space dimensions
    // CanvasRenderer will apply zoom on top of this
    this.textElement.style.width = `${this._width}px`;
    this.textElement.style.height = `${this._height}px`;
  }

  public updateStyle(style: Partial<HighResTextStyle>): void {
    this._style = { ...this._style, ...style };
    this.setupDOMElement();
  }

  public get text(): string {
    return this._text;
  }

  override get width(): number {
    return this._width;
  }

  override get height(): number {
    return this._height;
  }

  override get fillColor(): string | undefined {
    return this._style.color;
  }

  override set fillColor(color: string | undefined) {
    if (color) {
      this._style.color = color;
      this.textElement.style.color = color;
    }
  }
}
