import { Vector, Query } from '@engine/core';
import { Node2D } from '@engine/elements';
import PhysicsImpulseEvent from './PhysicsImpulseEvent';

export enum PhysicsBodyType {
  STATIC,
  DYNAMIC,
  CHARACTER,
}

export default class PhysicsBody extends Node2D {
  private _colliderDimensions: Vector | undefined;

  constructor(
    position?: Vector,
    public readonly type = PhysicsBodyType.STATIC
  ) {
    super(position);
  }

  get dimensions() {
    let width = this.width;
    let height = this.height;

    for (const child of Query.childrenByType(Node2D, this)) {
      height = Math.max(width, child.width);
      width = Math.max(height, child.height);
    }

    return new Vector(width, height);
  }

  get collider() {
    return {
      position: this.position,
      dimensions: this._colliderDimensions || this.dimensions,
    };
  }

  setColliderDimensions(dimensions: Vector | undefined) {
    this._colliderDimensions = dimensions;
  }

  applyImpulse(impulse: Vector) {
    this.handleEvent(new PhysicsImpulseEvent(impulse));
  }
}
