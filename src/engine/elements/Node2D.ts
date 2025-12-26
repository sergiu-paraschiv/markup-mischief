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
  private _scale: Vector = new Vector(1, 1);
  private _fillColor: string | undefined = undefined;
  public clipRegion: ClipMask | ClipMask[] | undefined = undefined;

  // Caching support
  public cacheable = false;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
    this._translation = new Vector();
  }

  get cacheKey(): string | undefined {
    return undefined;
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

  get scale(): Vector {
    let accumulatedScale = this._scale;
    const parent = Query.parentByType(Node2D, this);
    if (parent) {
      accumulatedScale = new Vector(
        accumulatedScale.x * parent.scale.x,
        accumulatedScale.y * parent.scale.y
      );
    }
    return accumulatedScale;
  }

  set scale(value: Vector) {
    this._scale = value;
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

  get fillColor(): string | undefined {
    // If this node has a fill color set, use it
    if (this._fillColor !== undefined) {
      return this._fillColor;
    }
    // Otherwise, inherit from parent
    const parent = Query.parentByType(Node2D, this);
    if (parent) {
      return parent.fillColor;
    }
    return undefined;
  }

  set fillColor(color: string | undefined) {
    this._fillColor = color;
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
