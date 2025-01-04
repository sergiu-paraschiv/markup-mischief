import { Event } from '@engine/core';
import PhysicsSimulation from './PhysicsSimulation';

export default class PhysicsTickEvent extends Event {
  constructor(
    public readonly currentTime: number,
    public readonly deltaTime: number,
    public readonly simulation: PhysicsSimulation
  ) {
    super();
    super.target = null;
  }
}
