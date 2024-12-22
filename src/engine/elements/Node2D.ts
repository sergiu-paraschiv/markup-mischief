import { Vector, Element, Query } from '@engine/core';
import { CanvasItem } from '@engine/renderer';

export default class Node2D extends CanvasItem {
  private _position: Vector;
  private _translation: Vector;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
    this._translation = new Vector();
  }

  get position() {
    const ownPosition = this._position.add(this._translation);
    const positionedParent = Query.parentByType(Node2D, this);
    if (positionedParent) {
      return positionedParent.position.add(ownPosition);
    }
    return ownPosition;
  }

  set position(newPosition: Vector) {
    this._position = newPosition;
  }

  set translation(newTranslation: Vector) {
    this._translation = newTranslation;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get width() {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get height() {
    return 0;
  }
}
