import { Vector, Query } from '@engine/core';
import { Node2D } from '@engine/elements';
import PhysicsSimulation from './PhysicsSimulation';

export default class CollisionObject extends Node2D {
  private _colliderDimensions: Vector | undefined;
  private _colliderOffset: Vector | undefined;
  protected sim: PhysicsSimulation | undefined;

  constructor(position?: Vector) {
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
    const offset = this._colliderOffset || new Vector(0, 0);
    const dimensions = this._colliderDimensions || this.dimensions;

    return {
      position: this.position.add(offset),
      dimensions,
    };
  }

  setColliderOffset(offset: Vector | undefined) {
    this._colliderOffset = offset;
  }

  setColliderDimensions(dimensions: Vector | undefined) {
    this._colliderDimensions = dimensions;
  }

  attachToSimulation(sim: PhysicsSimulation) {
    this.sim = sim;
  }
}
