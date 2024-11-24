import Vector from '../core/Vector';
import Element from '../core/Element';
import Query from '../core/Query';

export default class PositionedElement extends Element {
  private _position: Vector;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
  }

  get position() {
    const positionedParent = Query.parentByType(PositionedElement, this);
    if (positionedParent) {
      return positionedParent.position.add(this._position);
    }
    return this._position;
  }

  set position(newPosition: Vector) {
    this._position = newPosition;
  }
}
