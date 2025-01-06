/* eslint-disable @typescript-eslint/no-explicit-any */
import Event from './Event';

type EventType<E extends Event> = new (...args: never[]) => E;
type EventHandler<E extends Event> = (event: E) => boolean | void;

export default class EventEmitter {
  private _eventHandlers = new Map<EventType<any>, Set<EventHandler<any>>>();

  on<T extends Event>(eventType: EventType<T>, handler: EventHandler<T>): void {
    const handlers = this._eventHandlers.get(eventType) || new Set();
    if (handlers.has(handler)) {
      return;
    }

    handlers.add(handler);
    this._eventHandlers.set(eventType, handlers);
  }

  off<T extends Event>(
    eventType: EventType<T>,
    handler: EventHandler<T>
  ): void {
    const handlers = this._eventHandlers.get(eventType) || new Set();
    handlers.delete(handler);
    this._eventHandlers.set(eventType, handlers);
  }

  handleEvent(event: Event): void {
    for (const [eventType, handlers] of this._eventHandlers) {
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
