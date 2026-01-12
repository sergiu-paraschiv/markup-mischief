import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';

export default class AbsoluteLayout extends Node2D {
  constructor(position: Vector = new Vector(0, 0)) {
    super(position);
  }

  /**
   * Compute content dimensions from all children
   */
  protected computeContentSize(): Vector {
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];

    if (children.length === 0) {
      return new Vector(0, 0);
    }

    let maxWidth = 0;
    let maxHeight = 0;

    for (const child of children) {
      maxWidth = Math.max(maxWidth, child.width);
      maxHeight = Math.max(maxHeight, child.height);
    }

    return new Vector(maxWidth, maxHeight);
  }

  override get width(): number {
    const contentSize = this.computeContentSize();
    return contentSize.width;
  }

  override get height(): number {
    const contentSize = this.computeContentSize();
    return contentSize.height;
  }
}
