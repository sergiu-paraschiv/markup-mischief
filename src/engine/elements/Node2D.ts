import { Vector, Element, Query } from '@engine/core';
import { CanvasItem } from '@engine/renderer';

export interface ClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasItemClipMask {
  item: CanvasItem;
  position: Vector;
}

export type ClipMask = ClipRegion | CanvasItemClipMask;

export function isCanvasItemClipMask(
  mask: ClipMask
): mask is CanvasItemClipMask {
  return 'item' in mask && 'position' in mask;
}

export default class Node2D extends CanvasItem {
  private _position: Vector;
  private _translation: Vector;
  private _opacity = 1.0;
  public fillColor: string | undefined = undefined;
  public clipRegion: ClipMask | ClipMask[] | undefined = undefined;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
    this._translation = new Vector();
  }

  get opacity(): number {
    let accumulatedOpacity = this._opacity;
    const parent = Query.parentByType(Node2D, this);
    if (parent) {
      accumulatedOpacity *= parent.opacity;
    }
    return accumulatedOpacity;
  }

  set opacity(value: number) {
    this._opacity = value;
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

  get size() {
    return new Vector(this.width, this.height);
  }
}
