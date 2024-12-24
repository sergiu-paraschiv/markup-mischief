import { Event } from '@engine/core';
import RapierPhysicsSimulation from './RapierPhysicsSimulation';

export default class PhysicsTickEvent extends Event {
  constructor(
    public readonly currentTime: number,
    public readonly simulation: RapierPhysicsSimulation
  ) {
    super();
    super.target = null;
  }
}
