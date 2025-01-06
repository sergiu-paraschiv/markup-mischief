import {
  Element,
  Query,
  Vector,
  WorkLoop,
  ElementAddedEvent,
} from '@engine/core';
import PhysicsTickEvent from './PhysicsTickEvent';
import CollisionObject from './CollisionObject';
import AfterPhysicsTickEvent from './AfterPhysicsTickEvent';
import DynamicBody from './DynamicBody';

export interface DebugLine {
  from: Vector;
  to: Vector;
  color: string;
}

export type ColliderCheckFn = (collider: CollisionObject) => boolean;

export default class PhysicsSimulation {
  private viewport?: Vector;
  private rootElement?: Element;
  private readonly workLoop: WorkLoop;
  private lastCollisionObjects: {
    x: { position: Vector; dimensions: Vector }[];
    y: { position: Vector; dimensions: Vector }[];
  } = { x: [], y: [] };

  constructor(
    public readonly gravity = new Vector(0, 1024),
    public readonly maxVelocity = new Vector(128, 128)
  ) {
    this.workLoop = new WorkLoop(this.step.bind(this));
  }

  setViewport(viewport: Vector): void {
    this.viewport = viewport;
  }

  setRootElement(element: Element): void {
    this.rootElement = element;

    for (const co of Query.childrenByType(CollisionObject, this.rootElement)) {
      co.attachToSimulation(this);
    }

    this.rootElement.on(ElementAddedEvent, event => {
      const co = event.target;
      if (co instanceof CollisionObject) {
        co.attachToSimulation(this);
      }
    });
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  getDebugInformation() {
    const lines: DebugLine[] = [];

    function drawBox(position: Vector, dimensions: Vector, color: string) {
      const topLeft = position;
      const bottomRight = position.add(dimensions);

      topLeft.x = Math.floor(topLeft.x);
      topLeft.y = Math.floor(topLeft.y);
      bottomRight.x = Math.floor(bottomRight.x);
      bottomRight.y = Math.floor(bottomRight.y);

      lines.push({
        from: topLeft,
        to: new Vector(bottomRight.x, topLeft.y),
        color,
      });
      lines.push({
        from: new Vector(bottomRight.x, topLeft.y),
        to: bottomRight,
        color,
      });
      lines.push({
        from: bottomRight,
        to: new Vector(topLeft.x, bottomRight.y),
        color,
      });
      lines.push({
        from: new Vector(topLeft.x, bottomRight.y),
        to: topLeft,
        color,
      });
    }

    if (this.rootElement) {
      for (const collisionObject of Query.childrenByType(
        CollisionObject,
        this.rootElement
      )) {
        drawBox(
          collisionObject.collider.position,
          collisionObject.collider.dimensions,
          collisionObject instanceof DynamicBody && collisionObject.sleeping
            ? `rgba(199, 198, 194, 0.5)`
            : `rgba(172, 144, 0, 0.5)`
        );
      }

      if (this.lastCollisionObjects.x.length === 2) {
        drawBox(
          this.lastCollisionObjects.x[0].position,
          this.lastCollisionObjects.x[0].dimensions,
          `rgba(3, 32, 252, 0.5)`
        );

        drawBox(
          this.lastCollisionObjects.x[1].position,
          this.lastCollisionObjects.x[1].dimensions,
          `rgba(49, 252, 3, 0.5)`
        );
      }

      if (this.lastCollisionObjects.y.length === 2) {
        drawBox(
          this.lastCollisionObjects.y[0].position,
          this.lastCollisionObjects.y[0].dimensions,
          `rgba(3, 32, 252, 0.5)`
        );

        drawBox(
          this.lastCollisionObjects.y[1].position,
          this.lastCollisionObjects.y[1].dimensions,
          `rgba(252, 3, 65, 0.5)`
        );
      }
    }

    return lines;
  }

  checkFutureIntersection(
    position: Vector,
    velocity: Vector,
    colliderDimensions: Vector,
    collisionObject: CollisionObject
  ) {
    if (!this.rootElement) {
      return false;
    }

    const futurePosition = position.add(velocity);
    const r1Left = futurePosition.x;
    const r1Top = futurePosition.y;
    const r1Right = futurePosition.x + colliderDimensions.x;
    const r1Bottom = futurePosition.y + colliderDimensions.y;

    const r2Left = collisionObject.collider.position.x;
    const r2Top = collisionObject.collider.position.y;
    const r2Right =
      collisionObject.collider.position.x +
      collisionObject.collider.dimensions.x;
    const r2Bottom =
      collisionObject.collider.position.y +
      collisionObject.collider.dimensions.y;

    const intersection =
      Math.max(r1Left, r2Left) < Math.min(r1Right, r2Right) &&
      Math.max(r1Top, r2Top) < Math.min(r1Bottom, r2Bottom);

    if (intersection) {
      return collisionObject;
    }

    return undefined;
  }

  checkFutureCollisionX(
    checkedObject: CollisionObject,
    velocity: Vector,
    colliderCheckFn?: ColliderCheckFn,
    disableOtherColliderChecks?: boolean
  ) {
    if (!this.rootElement) {
      return undefined;
    }

    const collisionObjects = Query.childrenByType(
      CollisionObject,
      this.rootElement
    );
    const futurePosition = checkedObject.collider.position.add(velocity);
    const r1Left = futurePosition.x;
    const r1Right = futurePosition.x + checkedObject.collider.dimensions.x;

    for (const collisionObject of collisionObjects) {
      if (
        !disableOtherColliderChecks &&
        colliderCheckFn &&
        !colliderCheckFn(collisionObject)
      ) {
        continue;
      }

      if (
        !collisionObject.filterCollision({
          velocity,
          collider: checkedObject,
        })
      ) {
        continue;
      }

      const intersection = this.checkFutureIntersection(
        checkedObject.collider.position,
        velocity,
        checkedObject.collider.dimensions,
        collisionObject
      );

      const r2Left = collisionObject.collider.position.x;
      const r2Right =
        collisionObject.collider.position.x +
        collisionObject.collider.dimensions.x;

      if (intersection) {
        let distanceX = velocity.x;

        if (velocity.normal.x === 1) {
          if (r1Right > r2Left) {
            distanceX -= r1Right - r2Left;

            if (Math.abs(distanceX) < Math.abs(velocity.x)) {
              // console.log(debugKey, '+dx', distanceX);

              this.lastCollisionObjects.x = [
                checkedObject.collider,
                collisionObject.collider,
              ];

              return {
                collisionObject,
                normal: velocity.normal.x,
                distance: distanceX,
              };
            }
          }
        } else if (velocity.normal.x === -1) {
          if (r1Left < r2Right) {
            distanceX += r2Right - r1Left;

            if (Math.abs(distanceX) < Math.abs(velocity.x)) {
              // console.log(debugKey, '-dx', distanceX);

              this.lastCollisionObjects.x = [
                checkedObject.collider,
                collisionObject.collider,
              ];

              return {
                collisionObject,
                normal: velocity.normal.x,
                distance: distanceX,
              };
            }
          }
        }
      }
    }

    this.lastCollisionObjects.x = [];
    return undefined;
  }

  checkFutureCollisionY(
    checkedObject: CollisionObject,
    velocity: Vector,
    colliderCheckFn?: ColliderCheckFn,
    disableOtherColliderChecks?: boolean
  ) {
    if (!this.rootElement) {
      return undefined;
    }

    const collisionObjects = Query.childrenByType(
      CollisionObject,
      this.rootElement
    );
    const futurePosition = checkedObject.collider.position.add(velocity);
    const r1Top = futurePosition.y;
    const r1Bottom = futurePosition.y + checkedObject.collider.dimensions.y;

    for (const collisionObject of collisionObjects) {
      if (
        !disableOtherColliderChecks &&
        colliderCheckFn &&
        !colliderCheckFn(collisionObject)
      ) {
        continue;
      }

      if (
        !collisionObject.filterCollision({
          velocity,
          collider: checkedObject,
        })
      ) {
        continue;
      }

      const intersection = this.checkFutureIntersection(
        checkedObject.collider.position,
        velocity,
        checkedObject.collider.dimensions,
        collisionObject
      );

      const r2Top = collisionObject.collider.position.y;
      const r2Bottom =
        collisionObject.collider.position.y +
        collisionObject.collider.dimensions.y;

      if (intersection) {
        let distanceY = velocity.y;

        if (velocity.normal.y === 1) {
          if (r1Bottom > r2Top) {
            distanceY -= r1Bottom - r2Top;

            if (Math.abs(distanceY) < Math.abs(velocity.y)) {
              // console.log(debugKey, '+dy', distanceY);

              this.lastCollisionObjects.y = [
                checkedObject.collider,
                collisionObject.collider,
              ];

              return {
                collisionObject,
                normal: velocity.normal.y,
                distance: distanceY,
              };
            }
          }
        } else if (velocity.normal.y === -1) {
          if (r1Top < r2Bottom) {
            distanceY += r2Bottom - r1Top;

            if (Math.abs(distanceY) < Math.abs(velocity.y)) {
              // console.log(debugKey, '-dy', distanceY);

              this.lastCollisionObjects.y = [
                checkedObject.collider,
                collisionObject.collider,
              ];

              return {
                collisionObject,
                normal: velocity.normal.y,
                distance: distanceY,
              };
            }
          }
        }
      }
    }

    this.lastCollisionObjects.y = [];
    return undefined;
  }

  private step(currentTime: number, deltaTime: number) {
    if (!this.rootElement) {
      return;
    }

    this.rootElement.dispatchEvent(
      new PhysicsTickEvent(currentTime, deltaTime, this)
    );

    this.rootElement.dispatchEvent(
      new AfterPhysicsTickEvent(currentTime, deltaTime, this)
    );
  }
}
