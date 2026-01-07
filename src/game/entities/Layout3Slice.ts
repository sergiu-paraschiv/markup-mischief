import { Texture } from '@engine/loaders';
import { Node2D, Sprite } from '@engine/elements';
import { Vector } from '@engine/core';

export default class Layout3Slice extends Node2D {
  private _width = 0;
  private _height = 0;
  private _left: Texture | undefined;
  private _center: Texture | undefined;
  private _right: Texture | undefined;

  constructor(
    width: number,
    left: Texture | undefined,
    center: Texture | undefined,
    right: Texture | undefined
  ) {
    super();
    this._width = width;
    this._height = (left || center || right)?.height || 0;
    this._left = left;
    this._center = center;
    this._right = right;

    this.cacheable = true;

    const ls = new Sprite(left);
    const rs = new Sprite(right);

    this.addChild(ls);
    this.addChild(rs);

    rs.position = new Vector(width - rs.width, 0);
    if (rs.position.x < 3) {
      rs.clipRegion = { x: 3, y: 0, width: rs.width, height: rs.height };
    }

    const availableWidth = width - Math.min(width, ls.width + rs.width);
    let remainingWidth = availableWidth;
    let startLeft = ls.width;

    while (remainingWidth > 0) {
      const cs = new Sprite(center);
      cs.position = new Vector(startLeft, 0);

      if (remainingWidth < cs.width) {
        cs.clipRegion = {
          x: 0,
          y: 0,
          width: remainingWidth,
          height: cs.height,
        };
      }

      this.addChild(cs);

      remainingWidth -= cs.width;
      startLeft += cs.width;
    }
  }

  override get width() {
    return this._width * this.scale.x;
  }

  override get height() {
    return this._height * this.scale.y;
  }

  /**
   * Generate a cache key based on dimensions and texture IDs
   */
  override get cacheKey(): string | undefined {
    if (!this.cacheable) {
      return undefined;
    }
    const leftId = this._left?.id || 'none';
    const centerId = this._center?.id || 'none';
    const rightId = this._right?.id || 'none';
    const color = this.fillColor || 'none';
    return `3slice:${this._width}:${leftId}:${centerId}:${rightId}:${color}`;
  }
}
