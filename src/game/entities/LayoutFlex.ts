import { Node2D } from '@engine/elements';
import { Vector } from '@engine/core';

type FlexDirection = 'row' | 'column';
type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch';

export default class LayoutFlex extends Node2D {
  private _size: Vector;
  public flexDirection: FlexDirection = 'row';
  public justifyContent: JustifyContent = 'flex-start';
  public alignItems: AlignItems = 'flex-start';
  public gap = 0;

  constructor(position: Vector, size: Vector) {
    super(position);
    this._size = size;
  }

  override get width(): number {
    return this._size.width;
  }

  override get height(): number {
    return this._size.height;
  }

  override addChild(child: Node2D): void {
    super.addChild(child);
    this.layout();
  }

  override removeChild(child: Node2D): void {
    super.removeChild(child);
    this.layout();
  }

  public layout(): void {
    // Only layout direct children, not recursive
    const children = this.children.filter(
      child => child instanceof Node2D
    ) as Node2D[];
    if (children.length === 0) return;

    const isRow = this.flexDirection === 'row';
    const containerSize = isRow ? this._size.width : this._size.height;
    const crossSize = isRow ? this._size.height : this._size.width;

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
    let mainAxisPosition = this.calculateJustifyStart(
      containerSize,
      totalChildSize,
      children.length
    );
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
      const crossAxisPosition = this.calculateCrossAxisPosition(
        crossSize,
        childCrossSize
      );

      // Set child position
      if (isRow) {
        child.position = new Vector(mainAxisPosition, crossAxisPosition);
      } else {
        child.position = new Vector(crossAxisPosition, mainAxisPosition);
      }

      // Move to next position
      mainAxisPosition += childMainSize + this.gap + spacing;
    }
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
