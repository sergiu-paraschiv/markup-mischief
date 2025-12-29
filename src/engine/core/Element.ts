import Event, { EventPhase } from './Event';
import ElementAddedEvent from './ElementAddedEvent';
import ElementRemovedEvent from './ElementRemovedEvent';
import EventEmitter from './EventEmitter';
import ElementAttachedEvent from './ElementAttachedEvent';

export default class Element extends EventEmitter {
  private _parent?: Element;
  private _children: Element[] = [];
  private _depthSortedChildrenCache?: Element[];
  private _childrenCacheDirty = true;

  private _visible = true;
  private _depth = 0;

  constructor(children?: Element[]) {
    super();

    if (children) {
      children.forEach(child => this.addChild(child));
    }
  }

  set isVisible(visible) {
    this._visible = visible;
  }

  get isVisible(): boolean {
    if (!this._visible) {
      return false;
    }

    const parent = this.parent;
    if (parent) {
      return parent.isVisible;
    }

    return true;
  }

  get depth(): number {
    return this._depth;
  }

  set depth(newDepth: number) {
    if (this._depth === newDepth) {
      return;
    }

    this._depth = newDepth;

    // Mark parent's cache as dirty when depth changes
    if (this._parent) {
      this._parent._childrenCacheDirty = true;
    }
  }

  get children() {
    return this._children;
  }

  get depthSortedChildren() {
    if (this._childrenCacheDirty || !this._depthSortedChildrenCache) {
      this._depthSortedChildrenCache = [...this._children].sort(
        (a, b) => a.depth - b.depth
      );
      this._childrenCacheDirty = false;
    }
    return this._depthSortedChildrenCache;
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
    this.dispatchEvent(new ElementAttachedEvent());
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

  addChild(child: Element, depth = 0): void {
    this._children.push(child);
    child._depth = depth;
    this._childrenCacheDirty = true;
    child.parent = this;
    child.dispatchEvent(new ElementAddedEvent());
  }

  removeChild(child: Element): void {
    this._children = this._children.filter(
      searchedChild => searchedChild !== child
    );
    this._childrenCacheDirty = true;
    child.dispatchEvent(new ElementRemovedEvent());
    child.clearParent();
  }

  removeAllChildren(): void {
    this._children.forEach(child => {
      child.dispatchEvent(new ElementRemovedEvent());
      child.removeAllChildren();
      child.clearParent();
    });
    this._children = [];
    this._childrenCacheDirty = true;
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
    }
  }
}
