import { Vector, GlobalContext } from '@engine/core';
import { Node2D, Sprite } from '@engine/elements';
import { CharsMap, Char, AssetsMap } from '@engine/loaders';
import { Texture } from '@engine/loaders';

type TextStyle = 'regular' | 'hero';

const STYLE_CONFIG = {
  regular: {
    charsMapKey: 'Chars',
  },
  hero: {
    charsMapKey: 'CharsHero',
  },
};

export default class Text extends Node2D {
  private _width = 0;
  private _height = 0;
  private letterSpacing: number;
  private style: TextStyle;
  private _text = '';

  constructor(text?: string, letterSpacing = 1, style: TextStyle = 'regular') {
    super();
    this.letterSpacing = letterSpacing;
    this.style = style;
    if (text) {
      this.setText(text);
    }

    this.cacheable = true;
  }

  /**
   * Generate a cache key based on text content and rendering properties
   * This is called automatically by the renderer when needed
   */
  override get cacheKey(): string | undefined {
    if (!this.cacheable) {
      return undefined;
    }
    const color = this.fillColor || 'none';
    return `text:${this._text}:${this.style}:${this.letterSpacing}:${color}`;
  }

  override get fillColor(): string | undefined {
    return super.fillColor;
  }

  override set fillColor(color: string | undefined) {
    super.fillColor = color;

    // Apply color to all existing child sprites
    for (const child of this.children) {
      if (child instanceof Sprite) {
        child.fillColor = color;
      }
    }
  }

  private setTextFromTextures(textures: Texture[]): void {
    // Remove all existing children
    const children = [...this.children];
    for (const child of children) {
      this.removeChild(child);
    }

    // Reset dimensions
    this._width = 0;
    this._height = 0;

    for (let i = 0; i < textures.length; i += 1) {
      const texture = textures[i];
      const charSprite = new Sprite(texture, new Vector(this._width, 0));

      // Apply fillColor from parent if set
      if (this.fillColor) {
        charSprite.fillColor = this.fillColor;
      }

      this.addChild(charSprite);

      this._width += charSprite.width;
      if (i < textures.length - 1) {
        this._width += this.letterSpacing;
      }

      this._height = charSprite.height;
    }
  }

  public setText(text: string): void {
    this._text = text;
    const charsMap = GlobalContext.get<CharsMap>('chars');
    const config = STYLE_CONFIG[this.style];
    const chars = text.toLowerCase().split('');

    const textures: Texture[] = chars
      .map(char => {
        return (
          charsMap[config.charsMapKey][char] ||
          charsMap[config.charsMapKey][Char.UNKNOWN]
        );
      })
      .filter(item => item !== undefined);

    this.setTextFromTextures(textures);
  }

  public setTextFromCodes(
    codes: number[],
    tilemapName = 'Chars',
    assetName = 'Chars'
  ): void {
    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap = assets[assetName]?.tilemaps[tilemapName];

    if (!tilemap) {
      console.warn(
        `Tilemap "${tilemapName}" not found in asset "${assetName}"`
      );
      return;
    }

    const textures: Texture[] = [];
    for (const code of codes) {
      const texture = tilemap.get(code);
      if (!texture) {
        console.warn(`Texture at index ${code} not found in tilemap`);
        continue;
      }
      textures.push(texture);
    }

    this.setTextFromTextures(textures);
  }

  override get width() {
    return this._width;
  }

  override get height() {
    return this._height;
  }
}
