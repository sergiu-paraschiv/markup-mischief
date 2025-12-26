import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';

interface BoxSpacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export default class Box extends Node2D {
  private content?: Node2D;
  private _margin: Required<BoxSpacing>;
  private _padding: Required<BoxSpacing>;

  constructor(
    position: Vector = new Vector(0, 0),
    margin: BoxSpacing = {},
    padding: BoxSpacing = {}
  ) {
    super(position);

    this._margin = {
      top: margin.top ?? 0,
      right: margin.right ?? 0,
      bottom: margin.bottom ?? 0,
      left: margin.left ?? 0,
    };

    this._padding = {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    };
  }

  setContent(content: Node2D): void {
    // Remove existing content if any
    if (this.content) {
      this.removeChild(this.content);
    }

    this.content = content;

    // Position content with padding offset
    this.content.position = new Vector(this._padding.left, this._padding.top);

    this.addChild(this.content);
  }

  get margin(): Required<BoxSpacing> {
    return { ...this._margin };
  }

  get padding(): Required<BoxSpacing> {
    return { ...this._padding };
  }

  override get width(): number {
    if (!this.content) return 0;
    return (
      this._margin.left +
      this._padding.left +
      this.content.width +
      this._padding.right +
      this._margin.right
    );
  }

  override get height(): number {
    if (!this.content) return 0;
    return (
      this._margin.top +
      this._padding.top +
      this.content.height +
      this._padding.bottom +
      this._margin.bottom
    );
  }

  // Get content size (without padding/margin)
  get contentSize(): Vector {
    if (!this.content) return new Vector(0, 0);
    return new Vector(this.content.width, this.content.height);
  }

  // Get inner size (content + padding)
  get innerSize(): Vector {
    if (!this.content) return new Vector(0, 0);
    return new Vector(
      this._padding.left + this.content.width + this._padding.right,
      this._padding.top + this.content.height + this._padding.bottom
    );
  }
}
