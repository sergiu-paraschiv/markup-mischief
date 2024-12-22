import RAPIER from '@dimforge/rapier2d-compat';
import { Element, ElementAddedEvent, Vector, WorkLoop } from '@engine/core';
import IPhysicsSimulation, { DebugLine } from './IPhysicsSimulation';
import PhysicsTickEvent from './PhysicsTickEvent';
import PhysicsImpulseEvent from './PhysicsImpulseEvent';
import PhysicsBody, { PhysicsBodyType } from './PhysicsBody';

export default class RapierPhysicsSimulation implements IPhysicsSimulation {
  private rootElement?: Element;
  private readonly workLoop: WorkLoop;
  private world: RAPIER.World | undefined;

  constructor(
    private readonly pixelsPerMeter: number,
    private readonly heightAdjustment: number
  ) {
    this.workLoop = new WorkLoop(this.step.bind(this));

    (async () => {
      await RAPIER.init();
      this.world = new RAPIER.World({ x: 0.0, y: -9.81 });
    })();
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
    this.rootElement.on(
      ElementAddedEvent,
      event => {
        const pb = event.target;
        if (this.world && pb instanceof PhysicsBody) {
          const position = pb.collider.position;
          const dimensions = pb.collider.dimensions;
          const hw = dimensions.x / this.pixelsPerMeter / 2;
          const hh = dimensions.y / this.pixelsPerMeter / 2;

          const x = position.x / this.pixelsPerMeter;
          const y =
            (this.heightAdjustment - position.y - dimensions.y) /
            this.pixelsPerMeter;

          let colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cuboid(hw, hh));

          if (pb.type === PhysicsBodyType.STATIC) {
            colliderDesc.setTranslation(x + hw, y + hh);
            this.world.createCollider(colliderDesc);
          } else if (pb.type === PhysicsBodyType.DYNAMIC) {
            colliderDesc.setMass(0.25);
            const body = this.world.createRigidBody(
              RAPIER.RigidBodyDesc.dynamic()
                .lockRotations()
                .setTranslation(x + hw, y + hh)
            );

            this.world.createCollider(colliderDesc, body);
            pb.on(
              PhysicsTickEvent,
              () => {
                const newPosition = body.translation();
                pb.position = new Vector(
                  (newPosition.x - hw) * this.pixelsPerMeter,
                  this.heightAdjustment -
                    (newPosition.y + hh) * this.pixelsPerMeter
                );
              },
              true
            );

            pb.on(
              PhysicsImpulseEvent,
              event => {
                body.applyImpulse(
                  {
                    x: event.impulse.x / this.pixelsPerMeter,
                    y: event.impulse.y / this.pixelsPerMeter,
                  },
                  true
                );
              },
              true
            );
          } else if (pb.type === PhysicsBodyType.CHARACTER) {
            colliderDesc = new RAPIER.ColliderDesc(
              new RAPIER.Capsule(hh / 2, hw / 2)
            );
            colliderDesc.setMass(0.25);
            const body = this.world.createRigidBody(
              RAPIER.RigidBodyDesc.dynamic()
                .setDominanceGroup(10)
                .lockRotations()
                .setTranslation(x + hw, y + hh)
            );

            this.world.createCollider(colliderDesc, body);

            pb.on(
              PhysicsTickEvent,
              () => {
                const newPosition = body.translation();
                pb.position = new Vector(
                  (newPosition.x - hw) * this.pixelsPerMeter,
                  this.heightAdjustment -
                    (newPosition.y + hh) * this.pixelsPerMeter
                );
              },
              true
            );

            pb.on(
              PhysicsImpulseEvent,
              event => {
                let x = event.impulse.x / this.pixelsPerMeter;
                let y = event.impulse.y / this.pixelsPerMeter;

                if (Math.abs(body.linvel().x) > 4) {
                  x = 0;
                }

                if (Math.abs(body.linvel().y) > 0.1) {
                  y = 0;
                }

                body.applyImpulse({ x, y }, true);
              },
              true
            );
          }
        }
      },
      true
    );
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  getDebugInformation() {
    if (!this.world) {
      return [];
    }

    const lines: DebugLine[] = [];
    const { vertices, colors } = this.world.debugRender();

    for (let i = 0; i < vertices.length / 4; i += 1) {
      lines.push({
        from: new Vector(
          Math.round(vertices[i * 4] * this.pixelsPerMeter),
          this.heightAdjustment -
            Math.round(vertices[i * 4 + 1] * this.pixelsPerMeter)
        ),
        to: new Vector(
          Math.round(vertices[i * 4 + 2] * this.pixelsPerMeter),
          this.heightAdjustment -
            Math.round(vertices[i * 4 + 3] * this.pixelsPerMeter)
        ),
        color: `rgba(${Math.floor(colors[i * 8] * 255)}, ${Math.floor(colors[i * 8 + 1] * 255)}, ${Math.floor(colors[i * 8 + 2] * 255)}, ${colors[i * 8 + 3]})`,
      });
    }

    return lines;
  }

  private step(currentTime: number) {
    if (!this.rootElement || !this.world) {
      return;
    }

    this.world.step();

    this.rootElement.dispatchEvent(new PhysicsTickEvent(currentTime, this));
  }
}
