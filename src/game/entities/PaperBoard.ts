import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

export default class PaperBoard extends Node2D {
  private board: Node2D;

  constructor(position: Vector, size: Vector) {
    super(position);

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    this.board = new Layout9Slice(
      size,
      tilemap.get(33),
      tilemap.get(34),
      tilemap.get(35),
      tilemap.get(41),
      tilemap.get(42),
      tilemap.get(43),
      tilemap.get(49),
      tilemap.get(50),
      tilemap.get(51)
    );

    this.addChild(this.board);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
