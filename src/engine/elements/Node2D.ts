import { Vector, Element, Query } from '@engine/core';
import { CanvasItem } from '@engine/renderer';

export default class Node2D extends CanvasItem {
  private _position: Vector;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
  }

  get position() {
    const positionedParent = Query.parentByType(Node2D, this);
    if (positionedParent) {
      return positionedParent.position.add(this._position);
    }
    return this._position;
  }

  set position(newPosition: Vector) {
    this._position = newPosition;
  }
}
