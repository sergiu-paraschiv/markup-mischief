import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { HtmlPreview, Board } from '@game/entities';

export default class SolutionBoard extends Node2D {
  private board: Board;

  constructor(position: Vector, htmlPreview: HtmlPreview) {
    super(position);

    const padding = new Vector(10, 10);
    this.board = new Board(
      new Vector(0, 0),
      htmlPreview.size.add(padding.mul(2)),
      'secondary',
      false,
      'white'
    );
    htmlPreview.position = padding;

    (this.board.paper || this.board).addChild(htmlPreview);

    this.addChild(this.board);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
