import Event, { EventPhase } from './Event';
import EventEmitter from './EventEmitter';

export default class Element extends EventEmitter {
  private _parent?: Element;
  private _children: Element[] = [];

  constructor(children?: Element[]) {
    super();

    if (children) {
      this._children = children;
      children.forEach(child => (child.parent = this));
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

  get rootElement(): Element {
    if (this._parent === undefined) {
      return this;
    }

    return this._parent.rootElement;
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
      searchedChild => searchedChild !== child
    );
    child.clearParent();
  }

  removeAllChildren(): void {
    this._children.forEach(child => child.clearParent());
    this._children = [];
  }

  remove(): void {
    if (this._parent === undefined) {
      throw new Error('Cannot remove, no parent set!');
    }

    this._parent.removeChild(this);
  }

  dispatchEvent(event: Event): void {
    if (event.target === undefined) {
      event.target = this;
      this.rootElement.dispatchEvent(event);
      return;
    }

    super.handleEvent(event);
    if (event.propagationStopped) {
      return;
    }

    if (event.target === this) {
      event.capture();

      super.handleEvent(event);
      if (event.propagationStopped) {
        return;
      }

      event.bubble();
    }

    if (event.phase === EventPhase.CAPTURING) {
      if (this._children.length === 0) {
        event.destroy();
      }
      for (const child of this._children) {
        child.dispatchEvent(event);
        if (event.propagationStopped) {
          return;
        }
      }
    } else if (event.phase === EventPhase.BUBBLING) {
      if (this.parent) {
        this.parent.dispatchEvent(event);
      } else {
        event.destroy();
      }
    }
  }
}
