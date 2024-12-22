import { Element } from '@engine/core';

export default class CanvasItem extends Element {
  draw(): undefined | [CanvasImageSource, number, number] {
    return;
  }
}
