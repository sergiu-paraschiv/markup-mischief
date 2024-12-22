/* eslint-disable @typescript-eslint/no-explicit-any */
import Event, { EventPhase } from './Event';

type EventType<E extends Event> = new (...args: never[]) => E;
type EventHandler<E extends Event> = (event: E) => boolean | void;

export default class EventEmitter {
  private _capturingPhaseEventHandlers = new Map<
    EventType<any>,
    Set<EventHandler<any>>
  >();
  private _bubblingPhaseEventHandlers = new Map<
    EventType<any>,
    Set<EventHandler<any>>
  >();

  private getEventHandlers(capturingPhase?: boolean) {
    if (capturingPhase) {
      return this._capturingPhaseEventHandlers;
    }
    return this._bubblingPhaseEventHandlers;
  }

  on<T extends Event>(
    eventType: EventType<T>,
    handler: EventHandler<T>,
    capturingPhase?: boolean
  ): void {
    const handlers =
      this.getEventHandlers(capturingPhase).get(eventType) || new Set();
    if (handlers.has(handler)) {
      return;
    }

    handlers.add(handler);
    this.getEventHandlers(capturingPhase).set(eventType, handlers);
  }

  off<T extends Event>(
    eventType: EventType<T>,
    handler: EventHandler<T>,
    capturingPhase?: boolean
  ): void {
    const handlers =
      this.getEventHandlers(capturingPhase).get(eventType) || new Set();
    handlers.delete(handler);
    this.getEventHandlers(capturingPhase).set(eventType, handlers);
  }

  handleEvent(event: Event): void {
    for (const [eventType, handlers] of this.getEventHandlers(
      event.phase === EventPhase.CAPTURING
    )) {
      if (event instanceof eventType) {
        for (const handler of handlers) {
          handler(event);
          if (event.propagationStopped) {
            return;
          }
        }
      }
    }
  }
}
