import RAPIER from '@dimforge/rapier2d-compat';
import { Vector, Query } from '@engine/core';
import { Node2D } from '@engine/elements';
import RapierPhysicsSimulation from './RapierPhysicsSimulation';
import PhysicsTickEvent from './PhysicsTickEvent';

export enum PhysicsBodyType {
  STATIC,
  DYNAMIC,
  CHARACTER,
}

export default class PhysicsBody extends Node2D {
  private _colliderDimensions: Vector | undefined;
  private rigidBody: RAPIER.RigidBody | undefined;
  private sim: RapierPhysicsSimulation | undefined;
  private maxImpulse: Vector | undefined;

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

  setMaxImpulse(maxImpulse: Vector | undefined) {
    this.maxImpulse = maxImpulse;
  }

  applyImpulse(impulse: Vector) {
    if (!this.sim) {
      throw new Error('Not attached to a RapierPhysicsSimulation');
    }

    if (!this.rigidBody) {
      throw new Error('Not a RigidBody');
    }

    const simI = this.sim.vpToSimDim(impulse);

    if (
      this.maxImpulse &&
      Math.abs(this.rigidBody.linvel().x) > this.maxImpulse.x
    ) {
      simI.x = 0;
    }
    if (
      this.maxImpulse &&
      Math.abs(this.rigidBody.linvel().y) > this.maxImpulse.y
    ) {
      simI.y = 0;
    }
    this.rigidBody.applyImpulse(simI, true);
  }

  attachToSimulation(sim: RapierPhysicsSimulation) {
    this.sim = sim;
    this.buildSimulationBodies();
  }

  getLinVel() {
    if (!this.sim) {
      throw new Error('Not attached to a RapierPhysicsSimulation');
    }
    const bodyLinVel = this.rigidBody?.linvel();
    let linVel = new Vector(0, 0);
    if (bodyLinVel) {
      linVel = linVel.add(new Vector(bodyLinVel.x, bodyLinVel.y));
    }
    return this.sim.simToVpDim(linVel);
  }

  private buildSimulationBodies() {
    if (!this.sim) {
      throw new Error('Not attached to a RapierPhysicsSimulation');
    }

    const position = this.sim.vpToSimCoords(
      this.collider.position,
      this.collider.dimensions
    );

    const simD = this.sim.vpToSimDim(this.collider.dimensions).div(2);

    if (this.type === PhysicsBodyType.STATIC) {
      const colliderDesc = new RAPIER.ColliderDesc(
        new RAPIER.Cuboid(simD.width, simD.height)
      );
      colliderDesc.setTranslation(position.x, position.y);
      this.sim.world?.createCollider(colliderDesc);
    }

    if (this.type === PhysicsBodyType.CHARACTER) {
      const colliderDesc = new RAPIER.ColliderDesc(
        new RAPIER.Capsule(simD.height / 2, simD.width / 2)
      );
      colliderDesc.setMass(0.25);
      this.rigidBody = this.sim.world?.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .lockRotations()
          .setTranslation(position.x, position.y)
      );

      this.sim.world?.createCollider(colliderDesc, this.rigidBody);

      this.on(
        PhysicsTickEvent,
        () => {
          if (this.sim && this.rigidBody && !this.rigidBody.isSleeping()) {
            const newPosition = this.rigidBody.translation();
            this.position = this.sim.simToVpCoords(
              new Vector(newPosition.x, newPosition.y),
              this.collider.dimensions
            );
          }
        },
        true
      );
    }

    // else if (this.type === PhysicsBodyType.DYNAMIC) {
    //   colliderDesc.setMass(0.25);
    //   const body = this.world.createRigidBody(
    //     RAPIER.RigidBodyDesc.dynamic()
    //       .lockRotations()
    //       .setTranslation(position.x, position.y)
    //   );

    //   this.world.createCollider(colliderDesc, body);
    //   pb.on(
    //     PhysicsTickEvent,
    //     () => {
    //       const newPosition = body.translation();
    //       pb.position = new Vector(
    //         (newPosition.x - hw) * this.pixelsPerMeter,
    //         this.heightAdjustment - (newPosition.y + hh) * this.pixelsPerMeter
    //       );
    //     },
    //     true
    //   );

    //   pb.on(
    //     PhysicsImpulseEvent,
    //     event => {
    //       body.applyImpulse(
    //         {
    //           x: event.impulse.x / this.pixelsPerMeter,
    //           y: event.impulse.y / this.pixelsPerMeter,
    //         },
    //         true
    //       );
    //     },
    //     true
    //   );
  }
}
