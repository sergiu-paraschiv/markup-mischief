import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { HtmlPreview, SecondaryBoard } from '@game/entities';

export default class SolutionBoard extends Node2D {
  private board: Node2D;

  constructor(position: Vector, htmlPreview: HtmlPreview) {
    super(position);

    const padding = new Vector(10, 10);
    this.board = new SecondaryBoard(
      new Vector(0, 0),
      htmlPreview.size.add(padding.mul(2))
    );
    htmlPreview.position = padding;
    this.board.addChild(htmlPreview);

    this.addChild(this.board);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
