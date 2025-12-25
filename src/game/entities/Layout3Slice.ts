import { Texture } from '@engine/loaders';
import { Node2D, Sprite } from '@engine/elements';
import { Vector } from '@engine/core';

export default class Layout3Slice extends Node2D {
  private _width = 0;
  private _height = 0;

  constructor(
    width: number,
    left: Texture | undefined,
    center: Texture | undefined,
    right: Texture | undefined
  ) {
    super();
    this._width = width;
    this._height = (left || center || right)?.height || 0;

    const ls = new Sprite(left);
    const rs = new Sprite(right);

    this.addChild(ls);
    this.addChild(rs);

    rs.position = new Vector(width - rs.width, 0);

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
    return this._width;
  }

  override get height() {
    return this._height;
  }
}
