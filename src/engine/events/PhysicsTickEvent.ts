import { Event } from '@engine/core';

export default class PhysicsTickEvent extends Event {
  constructor(public readonly currentTime: number) {
    super();
  }
}
