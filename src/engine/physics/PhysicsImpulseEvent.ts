import { Event, Vector } from '@engine/core';

export default class PhysicsImpulseEvent extends Event {
  constructor(public readonly impulse: Vector) {
    super();
  }
}
