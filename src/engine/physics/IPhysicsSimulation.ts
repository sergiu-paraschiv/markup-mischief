import { Element, Vector } from '@engine/core';

export interface DebugLine {
  from: Vector;
  to: Vector;
  color: string;
}

export default interface IPhysicsSimulation {
  setRootElement(element: Element): void;
  start(fps: number): void;
  getDebugInformation(): DebugLine[];
}
