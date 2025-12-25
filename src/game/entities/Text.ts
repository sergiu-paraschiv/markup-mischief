import { Vector, GlobalContext } from '@engine/core';
import { Node2D, Sprite } from '@engine/elements';
import { CharsMap, Char } from '@engine/loaders';

export default class Text extends Node2D {
  private _width = 0;
  private _height = 0;
  private letterSpacing: number;

  constructor(text: string, letterSpacing = 1) {
    super();
    this.letterSpacing = letterSpacing;
    if (text) {
      this.setText(text);
    }
  }

  public setText(text: string): void {
    // Remove all existing children
    const children = [...this.children];
    for (const child of children) {
      this.removeChild(child);
    }

    // Reset dimensions
    this._width = 0;
    this._height = 0;

    const charsMap = GlobalContext.get<CharsMap>('chars');
    const chars = text.toLowerCase().split('');

    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      const texture =
        charsMap['Chars'][char] || charsMap['Chars'][Char.UNKNOWN];

      const charSprite = new Sprite(texture, new Vector(this._width, 0));

      // Apply fillColor from parent if set
      if (this.fillColor) {
        charSprite.fillColor = this.fillColor;
      }

      this.addChild(charSprite);

      this._width += charSprite.width;
      if (i < chars.length - 1) {
        this._width += this.letterSpacing;
      }

      this._height = charSprite.height;
    }
  }

  override get width() {
    return this._width;
  }

  override get height() {
    return this._height;
  }
}
