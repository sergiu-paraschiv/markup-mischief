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
  private textures: Texture[] = [];
  private _padding = new Vector(0, 0);

  constructor(text?: string, letterSpacing = 1, style: TextStyle = 'regular') {
    super();

    this.letterSpacing = letterSpacing;
    this.style = style;
    if (text) {
      this.setText(text);
    }

    this.cacheable = true;
  }

  override get cacheKey(): string | undefined {
    if (!this.cacheable) {
      return undefined;
    }
    const color = this.fillColor || 'none';
    return `text:${this._text}:${this.style}:${this.letterSpacing}:${this.scale.x}:${this.scale.y}:${color}`;
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

  private setTextFromTextures(): void {
    // Remove all existing children
    const children = [...this.children];
    for (const child of children) {
      this.removeChild(child);
    }

    // Reset dimensions
    this._width = this._padding.x * this.scale.x;
    this._height = this._padding.y * this.scale.y;

    for (let i = 0; i < this.textures.length; i += 1) {
      const texture = this.textures[i];
      const charSprite = new Sprite(
        texture,
        new Vector(this._width, this._height)
      );
      charSprite.scale = this.scale;

      // Apply fillColor from parent if set
      if (this.fillColor) {
        charSprite.fillColor = this.fillColor;
      }

      this.addChild(charSprite);

      this._width += charSprite.width * this.scale.x;
      if (i < this.textures.length - 1) {
        this._width += this.letterSpacing;
      }
    }

    this._height += this.textures[0].height * this.scale.y;

    this._width += this._padding.x * this.scale.x;
    this._height += this._padding.y * this.scale.y;
  }

  public setText(text: string): void {
    this._text = text;
    const charsMap = GlobalContext.get<CharsMap>('chars');
    const config = STYLE_CONFIG[this.style];
    const chars = text.toLowerCase().split('');

    this.textures = chars
      .map(char => {
        return (
          charsMap[config.charsMapKey][char] ||
          charsMap[config.charsMapKey][Char.UNKNOWN]
        );
      })
      .filter(item => item !== undefined);

    this.setTextFromTextures();
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

    this.textures = textures;

    this.setTextFromTextures();
  }

  public set padding(padding: Vector) {
    this._padding = padding;
    this.setTextFromTextures();
  }

  public get padding(): Vector {
    return this._padding;
  }

  public override set scale(scale: Vector) {
    super.scale = scale;
    this.setTextFromTextures();
  }

  public override get scale(): Vector {
    return super.scale;
  }

  override get width() {
    return this._width;
  }

  override get height() {
    return this._height;
  }
}
