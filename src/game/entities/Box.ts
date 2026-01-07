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
  private _gap: number;

  constructor(
    position: Vector = new Vector(0, 0),
    margin: BoxSpacing = {},
    padding: BoxSpacing = {},
    gap = 0
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

    this._gap = gap;
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

  override addChild(child: Node2D): void {
    super.addChild(child);
    this.layoutChildren();
  }

  override removeChild(child: Node2D): void {
    super.removeChild(child);
    this.layoutChildren();
  }

  /**
   * Position children vertically with padding and gap
   */
  private layoutChildren(): void {
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];

    let currentY = this._padding.top;

    for (const child of children) {
      child.position = new Vector(this._padding.left, currentY);
      currentY += child.height + this._gap;
    }
  }

  get margin(): Required<BoxSpacing> {
    return { ...this._margin };
  }

  get padding(): Required<BoxSpacing> {
    return { ...this._padding };
  }

  set padding(padding: Required<BoxSpacing>) {
    this._padding = padding;
  }

  get gap(): number {
    return this._gap;
  }

  set gap(value: number) {
    this._gap = value;
  }

  /**
   * Compute content dimensions from all children
   */
  protected computeContentSize(): Vector {
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];

    if (children.length === 0) {
      return new Vector(0, 0);
    }

    let maxWidth = 0;
    let totalHeight = 0;

    for (const child of children) {
      maxWidth = Math.max(maxWidth, child.width);
      totalHeight += child.height;
    }

    // Add gaps between children
    totalHeight += this._gap * (children.length - 1);

    return new Vector(maxWidth, totalHeight);
  }

  override get width(): number {
    const contentSize = this.computeContentSize();
    return (
      this._margin.left +
      this._padding.left +
      contentSize.width +
      this._padding.right +
      this._margin.right
    );
  }

  override get height(): number {
    const contentSize = this.computeContentSize();
    return (
      this._margin.top +
      this._padding.top +
      contentSize.height +
      this._padding.bottom +
      this._margin.bottom
    );
  }

  // Get content size (without padding/margin)
  get contentSize(): Vector {
    return this.computeContentSize();
  }

  // Get inner size (content + padding)
  get innerSize(): Vector {
    const contentSize = this.computeContentSize();
    return new Vector(
      this._padding.left + contentSize.width + this._padding.right,
      this._padding.top + contentSize.height + this._padding.bottom
    );
  }
}
