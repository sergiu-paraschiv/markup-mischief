import { Element, WorkLoop } from '@engine/core';
import { PhysicsTickEvent } from '@engine/events';
import IPhysicsSimulation from './IPhysicsSimulation';

export default class RapierPhysicsSimulation implements IPhysicsSimulation {
  private rootElement?: Element;
  private workLoop: WorkLoop;

  constructor() {
    this.workLoop = new WorkLoop(this.step.bind(this));

    // TODO: initialise Rapier
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  private step(currentTime: number) {
    if (!this.rootElement) {
      return;
    }

    // TODO: run Rapier step

    this.rootElement.dispatchEvent(new PhysicsTickEvent(currentTime));
  }
}
