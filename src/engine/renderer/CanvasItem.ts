import { Element } from '@engine/core';

export default class CanvasItem extends Element {
  public attachedDOM: HTMLElement | undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(_context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    // do nothing
  }
}
