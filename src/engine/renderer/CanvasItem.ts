import { Element } from '@engine/core';

export default class CanvasItem extends Element {
  private _visible = true;

  set isVisible(visible) {
    this._visible = visible;
  }

  get isVisible(): boolean {
    if (!this._visible) {
      return false;
    }

    const parent = this.parent;
    if (parent && parent instanceof CanvasItem) {
      return parent.isVisible;
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(_context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    // do nothing
  }
}
