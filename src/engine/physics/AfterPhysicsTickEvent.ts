import { Event } from '@engine/core';
import RapierPhysicsSimulation from './PhysicsSimulation';

export default class AfterPhysicsTickEvent extends Event {
  constructor(
    public readonly currentTime: number,
    public readonly deltaTime: number,
    public readonly simulation: RapierPhysicsSimulation
  ) {
    super();
    super.target = null;
  }
}
