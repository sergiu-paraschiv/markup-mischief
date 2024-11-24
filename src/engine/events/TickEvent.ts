import Event from '../core/Event';

export default class TickEvent extends Event {
  constructor(public readonly elapsedTime: number) {
    super();
  }
}
