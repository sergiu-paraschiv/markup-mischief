import { Element } from '@engine/core';

export default interface IPhysicsSimulation {
  setRootElement(element: Element): void;
  start(fps: number): void;
}
