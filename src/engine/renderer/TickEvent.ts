import { Event } from '@engine/core';

export default class TickEvent extends Event {
  constructor(public readonly currentTime: number) {
    super();
    super.target = null;
  }
}
