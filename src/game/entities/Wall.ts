import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';

export default class Wall extends Node2D {
  constructor(
    position?: Vector,
    private readonly size?: Vector
  ) {
    super(position);
  }

  override get width() {
    return this.size?.width || 0;
  }

  override get height() {
    return this.size?.height || 0;
  }
}
