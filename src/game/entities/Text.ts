import { Vector, GlobalContext } from '@engine/core';
import { Node2D, Sprite } from '@engine/elements';
import { CharsMap, Char, AssetsMap } from '@engine/loaders';
import { Texture } from '@engine/loaders';

export default class Text extends Node2D {
  private _width = 0;
  private _height = 0;
  private letterSpacing: number;

  constructor(text?: string, letterSpacing = 1) {
    super();
    this.letterSpacing = letterSpacing;
    if (text) {
      this.setText(text);
    }
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
    const charsMap = GlobalContext.get<CharsMap>('chars');
    const chars = text.toLowerCase().split('');

    const textures: Texture[] = chars
      .map(char => {
        return charsMap['Chars'][char] || charsMap['Chars'][Char.UNKNOWN];
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
