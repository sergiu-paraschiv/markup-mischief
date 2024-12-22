import { Event } from '@engine/core';
import IPhysicsSimulation from './IPhysicsSimulation';

export default class PhysicsTickEvent extends Event {
  constructor(
    public readonly currentTime: number,
    public readonly simulation: IPhysicsSimulation
  ) {
    super();
    super.target = null;
  }
}
