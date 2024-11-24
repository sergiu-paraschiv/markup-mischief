import Event from './Event';

type EventType<E extends Event> = new (...args: any[]) => E;
type EventHandler<E extends Event> = (event: E) => boolean | void;

export default class Element {
  private _parent?: Element;
  private _children: Element[] = [];
  private _eventHandlers: Map<EventType<any>, Set<EventHandler<any>>> =
    new Map();

  constructor(children?: Element[]) {
    if (children) {
      this._children = children;
      children.forEach((child) => (child.parent = this));
    }
  }

  get children() {
    return this._children;
  }

  get parent(): Element | undefined {
    return this._parent;
  }

  set parent(newParent: Element) {
    if (this._parent !== undefined) {
      throw new Error(
        'Cannot set parent while one already set! First remove this child from existing parent.'
      );
    }
    this._parent = newParent;
  }

  clearParent() {
    this._parent = undefined;
  }

  addChild(child: Element): void {
    this._children.push(child);
    child.parent = this;
  }

  removeChild(child: Element): void {
    this._children = this._children.filter(
      (searchedChild) => searchedChild !== child
    );
    child.clearParent();
  }

  removeAllChildren(): void {
    this._children.forEach((child) => child.clearParent());
    this._children = [];
  }

  remove(): void {
    if (this._parent === undefined) {
      throw new Error('Cannot remove, no parent set!');
    }

    this._parent.removeChild(this);
  }

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

  dispatchEvent(event: Event): void {
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

    for (const child of this._children) {
      child.dispatchEvent(event);
      if (event.propagationStopped) {
        return;
      }
    }
  }
}
