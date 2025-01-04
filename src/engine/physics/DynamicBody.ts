import { Vector } from '@engine/core';
import CollisionObject from './CollisionObject';
import AfterPhysicsTickEvent from './AfterPhysicsTickEvent';
import PhysicsTickEvent from './PhysicsTickEvent';

export default class DynamicBody extends CollisionObject {
  private _impulse = new Vector(0, 0);
  private avgVelAcc = [new Vector(0, 0), new Vector(0, 0), new Vector(0, 0)];

  constructor(position?: Vector) {
    super(position);

    this.on(
      PhysicsTickEvent,
      e => {
        if (this.sim) {
          this.applyDrag();
          this.applyImpulse(this.sim.gravity, e.deltaTime);
        }
      },
      true
    );

    this.on(
      AfterPhysicsTickEvent,
      e => {
        const totalMove = new Vector(0, 0);
        if (Math.abs(this._impulse.x) < 1) {
          this._impulse = new Vector(0, this._impulse.y);
        }

        if (Math.abs(this._impulse.y) < 1) {
          this._impulse = new Vector(this._impulse.x, 0);
        }

        if (this._impulse.x !== 0 || this._impulse.y !== 0) {
          const velocity = this.velocityDelta(this._impulse, e.deltaTime);
          const hit = this.checkHit(
            this._impulse,
            e.deltaTime,
            'AfterPhysicsTickEvent'
          );

          if (this._impulse.normal.x !== 0) {
            if (hit.x) {
              // console.log('x', hit.x.distance);
              this.position = this.position.add(new Vector(hit.x.distance, 0));
              this._impulse.x = 0;
              totalMove.x += hit.x.distance;
            } else {
              this.position = this.position.add(new Vector(velocity.x, 0));
              this._impulse.x -= velocity.x;
              totalMove.x += velocity.x;
            }
          }

          if (this._impulse.normal.y !== 0) {
            if (hit.y) {
              // console.log('y', hit.y.distance);
              this.position = this.position.add(new Vector(0, hit.y.distance));
              this._impulse.y = 0;
              totalMove.y += hit.y.distance;
            } else {
              this.position = this.position.add(new Vector(0, velocity.y));
              this._impulse.y -= velocity.y;
              totalMove.y += velocity.y;
            }
          }
        }

        this.avgVelAcc.shift();
        this.avgVelAcc.push(totalMove);
      },
      true
    );
  }

  private applyDrag(dragCoeficient = 0.9) {
    this._impulse.x *= dragCoeficient;
  }

  applyImpulse(impulse: Vector, deltaTime?: number) {
    if (deltaTime === undefined) {
      deltaTime = this.sim?.expectedDeltaT || 0;
    }

    const newImpulse = this._impulse.add(impulse);
    const hit = this.checkHit(newImpulse, deltaTime, 'applyImpulse');

    if (impulse.normal.x !== 0 && !hit.x) {
      this._impulse.x = newImpulse.x;
    }

    if (impulse.normal.y !== 0 && !hit.y) {
      this._impulse.y = newImpulse.y;
    }
  }

  velocityDelta(velocity: Vector, deltaTime: number) {
    const delta = velocity.mul(deltaTime / 1000);
    return new Vector(
      Math.ceil(Math.abs(delta.x)) * delta.normal.x,
      Math.ceil(Math.abs(delta.y)) * delta.normal.y
    );
  }

  // clampVelocity() {
  //   if (!this.sim) {
  //     return;
  //   }

  //   if (Math.abs(this._impulse.x) > this.sim.maxVelocity.x) {
  //     this._impulse.x = this.sim.maxVelocity.x * this._impulse.normal.x;
  //   }

  //   if (Math.abs(this._impulse.y) > this.sim.maxVelocity.y) {
  //     this._impulse.y = this.sim.maxVelocity.y * this._impulse.normal.y;
  //   }
  // }

  checkHit(velocity: Vector, deltaTime: number, debugKey?: string) {
    return {
      x: this.sim?.checkFutureCollisionsX(
        this.collider.position,
        this.velocityDelta(velocity, deltaTime),
        this.collider.dimensions,
        this.colliderCheck,
        debugKey
      ),
      y: this.sim?.checkFutureCollisionsY(
        this.collider.position,
        this.velocityDelta(velocity, deltaTime),
        this.collider.dimensions,
        this.colliderCheck,
        debugKey
      ),
    };
  }

  isGrounded() {
    const hit = this.checkHit(new Vector(0, 1), 1000, 'isGrounded');
    return !!hit.y;
  }

  get avgVelocity() {
    const avg = new Vector(0, 0);
    for (const v of this.avgVelAcc) {
      avg.x += v.x;
      avg.y += v.y;
    }
    return avg.div(this.avgVelAcc.length);
  }

  private colliderCheck(collider: CollisionObject) {
    return collider !== this;
    // return !(collider instanceof DynamicBody);
  }
}
