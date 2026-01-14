import { Vector, ElementAddedEvent, ElementRemovedEvent } from '@engine/core';
import Box from './Box';
import { Node2D } from '@engine/elements';

type FlexDirection = 'row' | 'column';
type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch';

export default class LayoutFlex extends Box {
  public flexDirection: FlexDirection = 'row';
  public justifyContent: JustifyContent = 'flex-start';
  public alignItems: AlignItems = 'flex-start';
  private _needsLayout = true;
  private _cachedContentSize: Vector | null = null;

  constructor(position: Vector = new Vector(0, 0)) {
    // Box constructor handles padding and gap
    super(position, {}, {}, 0);

    // Listen for descendant add/remove events to trigger layout recomputation
    this.on(ElementAddedEvent, () => {
      this.markLayoutDirty();
      this.layout();
    });
    this.on(ElementRemovedEvent, () => {
      this.markLayoug();
    });

    // Perform initial layout
    this.layout();
  }

  /**
   * Mark layout as dirty so it will recompute on next access
   */
  public markLayoutDirty(): void {
    this._needsLayout = true;
    this._cachedContentSize = null;
  }

  override get width(): number {
    if (this._needsLayout) {
      this.layout();
    }
    return super.width;
  }

  override get height(): number {
    if (this._needsLayout) {
      this.layout();
    }
    return super.height;
  }

  override addChild(child: Node2D): void {
    // Don't call super.addChild to avoid Box's layoutChildren
    // We'll handle layout ourselves
    Node2D.prototype.addChild.call(this, child);
    this.markLayoutDirty();
    // Eagerly layout to ensure children are positioned immediately
    this.layout();
  }

  override removeChild(child: Node2D): void {
    // Don't call super.removeChild to avoid Box's layoutChildren
    Node2D.prototype.removeChild.call(this, child);
    this.markLayoutDirty();
    // Eagerly layout to ensure remaining children are repositioned immediately
    this.layout();
  }

  /**
   * Override Box's dimension computation to compute based on flex direction
   * Cache the result and mark as dirty when children change
   */
  protected override computeContentSize(): Vector {
    // Return cached size if available and layout is not dirty
    if (this._cachedContentSize && !this._needsLayout) {
      return this._cachedContentSize;
    }
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];

    if (children.length === 0) {
      this._cachedContentSize = new Vector(0, 0);
      return this._cachedContentSize;
    }

    const isRow = this.flexDirection === 'row';
    let size: Vector;

    if (isRow) {
      // Row: sum widths, max height
      let totalWidth = 0;
      let maxHeight = 0;

      for (const child of children) {
        totalWidth += child.width;
        maxHeight = Math.max(maxHeight, child.height);
      }

      // Add gaps between children
      totalWidth += this.gap * (children.length - 1);

      size = new Vector(totalWidth, maxHeight);
    } else {
      // Column: max width, sum heights
      let maxWidth = 0;
      let totalHeight = 0;

      for (const child of children) {
        maxWidth = Math.max(maxWidth, child.width);
        totalHeight += child.height;
      }

      // Add gaps between children
      totalHeight += this.gap * (children.length - 1);

      size = new Vector(maxWidth, totalHeight);
    }

    // Cache the computed size
    this._cachedContentSize = size;
    return size;
  }

  public layout(): void {
    // Only layout direct children, not recursive
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];
    if (children.length === 0) {
      this._needsLayout = false;
      return;
    }

    const isRow = this.flexDirection === 'row';
    const contentSize = this.contentSize;

    // Account for padding on both sides
    const paddingMain = isRow ? this.padding.left : this.padding.top;
    const paddingCross = isRow ? this.padding.top : this.padding.left;
    const containerSize = isRow ? contentSize.width : contentSize.height;
    const crossSize = isRow ? contentSize.height : contentSize.width;

    // Calculate total size of children along main axis
    let totalChildSize = 0;
    const childSizes: number[] = [];

    for (const child of children) {
      const size = isRow ? child.width : child.height;
      childSizes.push(size);
      totalChildSize += size;
    }

    // Add gaps
    const totalGap = this.gap * (children.length - 1);
    totalChildSize += totalGap;

    // Calculate starting position based on justifyContent
    let mainAxisPosition =
      this.calculateJustifyStart(
        containerSize,
        totalChildSize,
        children.length
      ) + paddingMain; // Add padding offset
    const spacing = this.calculateSpacing(
      containerSize,
      totalChildSize,
      children.length
    );

    // Position each child
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childMainSize = childSizes[i];
      const childCrossSize = isRow ? child.height : child.width;

      // Calculate cross axis position based on alignItems
      const crossAxisPosition =
        this.calculateCrossAxisPosition(crossSize, childCrossSize) +
        paddingCross; // Add padding offset

      // Set child position
      if (isRow) {
        child.position = new Vector(mainAxisPosition, crossAxisPosition);
      } else {
        child.position = new Vector(crossAxisPosition, mainAxisPosition);
      }

      // Move to next position
      mainAxisPosition += childMainSize + this.gap + spacing;
    }

    // Clear the dirty flag after layout is complete
    this._needsLayout = false;
  }

  private calculateJustifyStart(
    containerSize: number,
    totalChildSize: number,
    childCount: number
  ): number {
    switch (this.justifyContent) {
      case 'flex-start':
        return 0;
      case 'flex-end':
        return containerSize - totalChildSize;
      case 'center':
        return (containerSize - totalChildSize) / 2;
      case 'space-between':
        return 0;
      case 'space-around': {
        const totalSpacing = containerSize - totalChildSize;
        return totalSpacing / (childCount * 2);
      }
      default:
        return 0;
    }
  }

  private calculateSpacing(
    containerSize: number,
    totalChildSize: number,
    childCount: number
  ): number {
    const remainingSpace = containerSize - totalChildSize;

    switch (this.justifyContent) {
      case 'space-between':
        return childCount > 1 ? remainingSpace / (childCount - 1) : 0;
      case 'space-around':
        return childCount > 0 ? remainingSpace / childCount : 0;
      default:
        return 0;
    }
  }

  private calculateCrossAxisPosition(
    containerCrossSize: number,
    childCrossSize: number
  ): number {
    switch (this.alignItems) {
      case 'flex-start':
        return 0;
      case 'flex-end':
        return containerCrossSize - childCrossSize;
      case 'center':
        return (containerCrossSize - childCrossSize) / 2;
      case 'stretch':
        // TODO: For stretch, we would need to modify child size, which is complex
        // For now, just center it
        return (containerCrossSize - childCrossSize) / 2;
      default:
        return 0;
    }
  }
}

/**
 * FixedSizeLayoutFlex - A layout flex container with a fixed explicit size
 */
export class FixedSizeLayoutFlex extends LayoutFlex {
  private _fixedSize: Vector;

  constructor(position: Vector, size: Vector) {
    // Set fixed size BEFORE calling super to ensure computeContentSize works correctly
    // We need to use Object.defineProperty to set it before super() is called
    super(position);
    this._fixedSize = size;
    // Re-layout now that fixed size is set
    this.layout();
  }

  /**
   * Override to return fixed size instead of computed size
   * The fixed size represents the TOTAL size, so we need to subtract padding
   * to get the content size (since Box's width/height getters add padding back)
   */
  protected override computeContentSize(): Vector {
    // Return fixed size if set, otherwise fall back to 0,0
    if (!this._fixedSize) {
      return new Vector(0, 0);
    }
    // Subtract padding from fixed size to get content size
    const contentWidth = Math.max(
      0,
      this._fixedSize.width - this.padding.left - this.padding.right
    );
    const contentHeight = Math.max(
      0,
      this._fixedSize.height - this.padding.top - this.padding.bottom
    );
    return new Vector(contentWidth, contentHeight);
  }

  /**
   * Update the fixed size
   */
  public setSize(size: Vector): void {
    this._fixedSize = size;
    this.markLayoutDirty();
  }
}
