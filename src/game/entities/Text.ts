import { Vector } from '@engine/core';
import { Node2D, Sprite } from '@engine/elements';
import { Assets } from '@game';

export default class Text extends Node2D {
  private _width = 0;
  private _height = 0;

  constructor(text: string, letterSpacing = 1) {
    super();

    const chars = text.toLowerCase().split('');
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      const texture =
        Assets.charmap['Chars'][char] ||
        Assets.aseprite['Chars'].tilemaps['Chars'].get(78);
      const charSprite = new Sprite(texture);
      charSprite.position = new Vector(this._width, 0);
      this.addChild(charSprite);

      this._width += charSprite.width;
      if (i < chars.length - 1) {
        this._width += letterSpacing;
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
