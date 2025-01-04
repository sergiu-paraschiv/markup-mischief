import { Vector, Query } from '@engine/core';
import { Node2D } from '@engine/elements';
import PhysicsSimulation from './PhysicsSimulation';

interface CollisionFilterData {
  collider: CollisionObject;
  velocity: Vector;
}
type FilterCollisionFn = (data: CollisionFilterData) => boolean;

export default class CollisionObject extends Node2D {
  protected sim: PhysicsSimulation | undefined;
  private _colliderDimensions: Vector | undefined;
  private _colliderOffset: Vector | undefined;
  private _filterCollision: FilterCollisionFn | undefined;
  protected _sleeping = false;
  private _canSleep = false;

  constructor(position?: Vector) {
    super(position);
  }

  get dimensions() {
    let width = this.width;
    let height = this.height;

    for (const child of Query.childrenByType(Node2D, this)) {
      width = Math.max(width, child.width);
      height = Math.max(height, child.height);
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

  set filterCollisionFn(fn: FilterCollisionFn | undefined) {
    this._filterCollision = fn;
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

  filterCollision(data: CollisionFilterData): boolean {
    if (this._filterCollision) {
      return this._filterCollision(data);
    }

    return true;
  }

  get sleeping() {
    return this._sleeping;
  }

  wakeUp() {
    this._sleeping = false;
  }

  get canSleep() {
    return this._canSleep;
  }

  set canSleep(canSleep: boolean) {
    this._canSleep = canSleep;
  }
}
