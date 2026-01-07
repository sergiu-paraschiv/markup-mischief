import { Texture } from '@engine/loaders';
import { Node2D, Sprite } from '@engine/elements';
import { Vector } from '@engine/core';

/**
 * 9-slice layout for scalable UI panels
 * Divides the texture into 9 regions:
 *   TL  TC  TR
 *   ML  MC  MR
 *   BL  BC  BR
 * Corners stay fixed size, edges tile, center fills
 */
export default class Layout9Slice extends Node2D {
  private _size = new Vector(0, 0);
  private _topLeft: Texture | undefined;
  private _topCenter: Texture | undefined;
  private _topRight: Texture | undefined;
  private _middleLeft: Texture | undefined;
  private _middleCenter: Texture | undefined;
  private _middleRight: Texture | undefined;
  private _bottomLeft: Texture | undefined;
  private _bottomCenter: Texture | undefined;
  private _bottomRight: Texture | undefined;

  constructor(
    size: Vector,
    topLeft: Texture | undefined,
    topCenter: Texture | undefined,
    topRight: Texture | undefined,
    middleLeft: Texture | undefined,
    middleCenter: Texture | undefined,
    middleRight: Texture | undefined,
    bottomLeft: Texture | undefined,
    bottomCenter: Texture | undefined,
    bottomRight: Texture | undefined
  ) {
    super();
    this._size = size;
    this._topLeft = topLeft;
    this._topCenter = topCenter;
    this._topRight = topRight;
    this._middleLeft = middleLeft;
    this._middleCenter = middleCenter;
    this._middleRight = middleRight;
    this._bottomLeft = bottomLeft;
    this._bottomCenter = bottomCenter;
    this._bottomRight = bottomRight;

    this.cacheable = true;

    // Create corner sprites
    const tlSprite = new Sprite(topLeft);
    const trSprite = new Sprite(topRight);
    const blSprite = new Sprite(bottomLeft);
    const brSprite = new Sprite(bottomRight);

    // Add corners
    this.addChild(tlSprite);
    this.addChild(trSprite);
    this.addChild(blSprite);
    this.addChild(brSprite);

    // Position corners
    tlSprite.position = new Vector(0, 0);
    trSprite.position = new Vector(size.width - trSprite.width, 0);
    blSprite.position = new Vector(0, size.height - blSprite.height);
    brSprite.position = new Vector(
      size.width - brSprite.width,
      size.height - brSprite.height
    );

    // Clip right corners from the left if they would overlap with left corners
    const clipHorizontally = trSprite.position.x < 3 || brSprite.position.x < 3;

    if (trSprite.position.x < 3) {
      trSprite.clipRegion = {
        x: 3,
        y: 0,
        width: trSprite.width,
        height: trSprite.height,
      };
    }
    if (brSprite.position.x < 3) {
      brSprite.clipRegion = {
        x: 3,
        y: 0,
        width: brSprite.width,
        height: brSprite.height,
      };
    }

    // Clip bottom corners from the top if they would overlap with top corners
    if (blSprite.position.y < 3) {
      blSprite.clipRegion = {
        x: 0,
        y: 3,
        width: blSprite.width,
        height: blSprite.height,
      };
    }
    if (brSprite.position.y < 3) {
      // If already clipped horizontally, we need to preserve x: 3
      brSprite.clipRegion = {
        x: clipHorizontally ? 3 : 0,
        y: 3,
        width: brSprite.width,
        height: brSprite.height,
      };
    }

    // Calculate available space for edges and center
    const leftWidth = tlSprite.width;
    const rightWidth = trSprite.width;
    const topHeight = tlSprite.height;
    const bottomHeight = blSprite.height;

    const availableWidth = size.width - leftWidth - rightWidth;
    const availableHeight = size.height - topHeight - bottomHeight;

    // Determine if we need to clip edges due to overlapping corners
    const clipVertically = blSprite.position.y < 3 || brSprite.position.y < 3;

    // Tile top edge
    this.tileHorizontal(
      topCenter,
      leftWidth,
      0,
      availableWidth,
      clipHorizontally,
      false
    );

    // Tile bottom edge
    this.tileHorizontal(
      bottomCenter,
      leftWidth,
      size.height - bottomHeight,
      availableWidth,
      clipHorizontally,
      clipVertically // Bottom edge doesn't need vertical clipping
    );

    // Tile left edge
    this.tileVertical(
      middleLeft,
      0,
      topHeight,
      availableHeight,
      clipHorizontally,
      clipVertically
    );

    // Tile right edge
    this.tileVertical(
      middleRight,
      size.width - rightWidth,
      topHeight,
      availableHeight,
      false,
      clipVertically
    );

    // Fill center
    this.fillCenter(
      middleCenter,
      leftWidth,
      topHeight,
      availableWidth,
      availableHeight,
      clipHorizontally,
      clipVertically
    );
  }

  /**
   * Tiles a texture horizontally
   */
  private tileHorizontal(
    texture: Texture | undefined,
    startX: number,
    y: number,
    totalWidth: number,
    clipFromLeft = false,
    clipFromTop = false
  ): void {
    if (!texture || totalWidth <= 0) return;

    let remainingWidth = totalWidth;
    let currentX = startX;

    while (remainingWidth > 0) {
      const sprite = new Sprite(texture);
      sprite.position = new Vector(currentX, y);

      const needsClipping =
        remainingWidth < sprite.width || clipFromLeft || clipFromTop;

      if (needsClipping) {
        sprite.clipRegion = {
          x: clipFromLeft ? 3 : 0,
          y: clipFromTop ? 3 : 0,
          width: remainingWidth < sprite.width ? remainingWidth : sprite.width,
          height: sprite.height,
        };
      }

      this.addChild(sprite);
      remainingWidth -= sprite.width;
      currentX += sprite.width;
    }
  }

  /**
   * Tiles a texture vertically
   */
  private tileVertical(
    texture: Texture | undefined,
    x: number,
    startY: number,
    totalHeight: number,
    clipFromLeft = false,
    clipFromTop = false
  ): void {
    if (!texture || totalHeight <= 0) return;

    let remainingHeight = totalHeight;
    let currentY = startY;

    while (remainingHeight > 0) {
      const sprite = new Sprite(texture);
      sprite.position = new Vector(x, currentY);

      const needsClipping =
        remainingHeight < sprite.height || clipFromLeft || clipFromTop;

      if (needsClipping) {
        sprite.clipRegion = {
          x: clipFromLeft ? 3 : 0,
          y: clipFromTop ? 3 : 0,
          width: sprite.width,
          height:
            remainingHeight < sprite.height ? remainingHeight : sprite.height,
        };
      }

      this.addChild(sprite);
      remainingHeight -= sprite.height;
      currentY += sprite.height;
    }
  }

  /**
   * Fills the center area by tiling both horizontally and vertically
   */
  private fillCenter(
    texture: Texture | undefined,
    startX: number,
    startY: number,
    totalWidth: number,
    totalHeight: number,
    clipFromLeft = false,
    clipFromTop = false
  ): void {
    if (!texture || totalWidth <= 0 || totalHeight <= 0) return;

    let remainingHeight = totalHeight;
    let currentY = startY;

    while (remainingHeight > 0) {
      let remainingWidth = totalWidth;
      let currentX = startX;

      while (remainingWidth > 0) {
        const sprite = new Sprite(texture);
        sprite.position = new Vector(currentX, currentY);

        const clipWidth = Math.min(remainingWidth, sprite.width);
        const clipHeight = Math.min(remainingHeight, sprite.height);

        const needsClipping =
          clipWidth < sprite.width ||
          clipHeight < sprite.height ||
          clipFromLeft ||
          clipFromTop;

        if (needsClipping) {
          sprite.clipRegion = {
            x: clipFromLeft ? 3 : 0,
            y: clipFromTop ? 3 : 0,
            width: clipWidth,
            height: clipHeight,
          };
        }

        this.addChild(sprite);
        remainingWidth -= sprite.width;
        currentX += sprite.width;
      }

      remainingHeight -= texture.height;
      currentY += texture.height;
    }
  }

  override get width() {
    return this._size.width;
  }

  override get height() {
    return this._size.height;
  }

  override get cacheKey(): string | undefined {
    if (!this.cacheable) {
      return undefined;
    }
    const tlId = this._topLeft?.id || 'none';
    const tcId = this._topCenter?.id || 'none';
    const trId = this._topRight?.id || 'none';
    const mlId = this._middleLeft?.id || 'none';
    const mcId = this._middleCenter?.id || 'none';
    const mrId = this._middleRight?.id || 'none';
    const blId = this._bottomLeft?.id || 'none';
    const bcId = this._bottomCenter?.id || 'none';
    const brId = this._bottomRight?.id || 'none';
    const color = this.fillColor || 'none';
    return `9slice:${this._size.width}:${this._size.height}:${tlId}:${tcId}:${trId}:${mlId}:${mcId}:${mrId}:${blId}:${bcId}:${brId}:${color}`;
  }
}
