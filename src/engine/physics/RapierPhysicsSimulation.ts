import RAPIER from '@dimforge/rapier2d-compat';
import { Element, WorkLoop } from '@engine/core';
import IPhysicsSimulation from './IPhysicsSimulation';
import PhysicsTickEvent from './PhysicsTickEvent';

export default class RapierPhysicsSimulation implements IPhysicsSimulation {
  private rootElement?: Element;
  private readonly workLoop: WorkLoop;
  private world: RAPIER.World | undefined;

  constructor() {
    this.workLoop = new WorkLoop(this.step.bind(this));

    (async () => {
      await RAPIER.init();
      this.world = new RAPIER.World({ x: 0.0, y: -9.81 });
    })();
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  private step(currentTime: number) {
    if (!this.rootElement || !this.world) {
      return;
    }

    this.world.step();

    this.rootElement.dispatchEvent(new PhysicsTickEvent(currentTime));
  }
}
