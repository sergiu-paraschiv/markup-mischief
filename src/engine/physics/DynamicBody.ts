import { Query, Vector } from '@engine/core';
import CollisionObject from './CollisionObject';
import AfterPhysicsTickEvent from './AfterPhysicsTickEvent';
import PhysicsTickEvent from './PhysicsTickEvent';
import { ColliderCheckFn } from './PhysicsSimulation';

const SLEEP_DELAY = 1000;

export default class DynamicBody extends CollisionObject {
  private _impulse = new Vector(0, 0);
  protected _sleeping = false;
  private _canSleep = true;
  private _sleepDelay = SLEEP_DELAY;
  private avgVelAcc = [
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
  ];

  constructor(position?: Vector) {
    super(position);

    this.on(PhysicsTickEvent, e => {
      if (this.sim && !this._sleeping) {
        this.applyDrag();
        this.applyImpulse(
          this.velocityDelta(this.sim.gravity, e.deltaTime),
          e.deltaTime,
          false
        );
      }
    });

    this.on(AfterPhysicsTickEvent, e => {
      if (this._sleeping) {
        return;
      }

      if (Math.abs(this._impulse.x) < 1) {
        this._impulse = new Vector(0, this._impulse.y);
      }

      if (Math.abs(this._impulse.y) < 1) {
        this._impulse = new Vector(this._impulse.x, 0);
      }

      const totalMove = new Vector(0, 0);
      if (this._impulse.x !== 0 || this._impulse.y !== 0) {
        const velocity = this.velocityDelta(this._impulse, e.deltaTime);
        const hit = this.checkHit(this._impulse, e.deltaTime);

        if (this._impulse.normal.x !== 0) {
          if (hit.x) {
            // console.log('x', hit.x.distance, e.currentTime);
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
            // console.log('y', hit.y.distance, e.currentTime);
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

      this.avgVelAcc.pop();
      this.avgVelAcc.unshift(totalMove);

      if (this.canSleep) {
        const avgVel = this.avgVelocity(9);
        if (avgVel.x === 0 && avgVel.y === 0) {
          if (this._sleepDelay <= 0) {
            this._sleeping = true;
          } else {
            this._sleepDelay -= e.deltaTime;
          }
        }
      }
    });
  }

  private applyDrag(dragCoeficient = 0.85) {
    this._impulse.x *= dragCoeficient;
  }

  applyImpulse(impulse: Vector, deltaTime: number, wakeUp = true) {
    if (wakeUp) {
      this.wakeUp();
    }

    const newImpulse = this._impulse.add(impulse);
    const hit = this.checkHit(newImpulse, deltaTime);

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
      Math.abs(delta.x) * delta.normal.x,
      Math.abs(delta.y) * delta.normal.y
    );
  }

  checkHit(
    velocity: Vector,
    deltaTime: number,
    colliderCheckFn?: ColliderCheckFn,
    disableOtherColliderChecks?: boolean
  ) {
    return {
      x: this.sim?.checkFutureCollisionX(
        this,
        this.velocityDelta(velocity, deltaTime),
        collider =>
          this.colliderCheck(collider) &&
          (colliderCheckFn ? colliderCheckFn(collider) : true),
        disableOtherColliderChecks
      ),
      y: this.sim?.checkFutureCollisionY(
        this,
        this.velocityDelta(velocity, deltaTime),
        collider =>
          this.colliderCheck(collider) &&
          (colliderCheckFn ? colliderCheckFn(collider) : true),
        disableOtherColliderChecks
      ),
    };
  }

  checkFutureIntersection(velocity: Vector, colliderCheckFn?: ColliderCheckFn) {
    const collisionObjects = Query.childrenByType(
      CollisionObject,
      this.rootElement
    );

    for (const collisionObject of collisionObjects) {
      if (colliderCheckFn && !colliderCheckFn(collisionObject)) {
        continue;
      }

      const intersects = this.sim?.checkFutureIntersection(
        this.collider.position,
        velocity,
        this.collider.dimensions,
        collisionObject
      );

      if (intersects) {
        return intersects;
      }
    }

    return undefined;
  }

  checkAllFutureIntersections(
    velocity: Vector,
    colliderCheckFn?: ColliderCheckFn
  ) {
    const collisionObjects = Query.childrenByType(
      CollisionObject,
      this.rootElement
    );

    const results: CollisionObject[] = [];

    for (const collisionObject of collisionObjects) {
      if (colliderCheckFn && !colliderCheckFn(collisionObject)) {
        continue;
      }

      const intersects = this.sim?.checkFutureIntersection(
        this.collider.position,
        velocity,
        this.collider.dimensions,
        collisionObject
      );

      if (intersects) {
        results.push(intersects);
      }
    }

    return results;
  }

  checkCurrentIntersection(colliderCheckFn?: ColliderCheckFn) {
    return this.checkFutureIntersection(new Vector(0, 0), colliderCheckFn);
  }

  checkAllCurrentIntersections(colliderCheckFn?: ColliderCheckFn) {
    return this.checkAllFutureIntersections(new Vector(0, 0), colliderCheckFn);
  }

  isGrounded() {
    const hit = this.checkHit(new Vector(0, 1), 1000);
    return !!hit.y;
  }

  avgVelocity(numSamples = 3) {
    const avg = new Vector(0, 0);
    numSamples = Math.min(numSamples, 9);
    const samples = this.avgVelAcc.slice(0, numSamples);
    for (const v of samples) {
      avg.x += v.x;
      avg.y += v.y;
    }
    return avg.div(numSamples);
  }

  private colliderCheck(collider: CollisionObject) {
    return collider !== this;
    // return !(collider instanceof DynamicBody);
  }

  get sleeping() {
    return this._sleeping;
  }

  wakeUp() {
    this._sleeping = false;
    this._sleepDelay = SLEEP_DELAY;
  }

  get canSleep() {
    return this._canSleep;
  }

  set canSleep(canSleep: boolean) {
    this._canSleep = canSleep;
  }
}
