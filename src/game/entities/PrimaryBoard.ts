import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

import PaperBoard from './PaperBoard';

export default class PrimaryBoard extends Node2D {
  private board: Node2D;
  private paper: Node2D;

  constructor(position: Vector, size: Vector) {
    super(position);

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    this.board = new Layout9Slice(
      size,
      tilemap.get(1),
      tilemap.get(2),
      tilemap.get(3),
      tilemap.get(9),
      tilemap.get(10),
      tilemap.get(11),
      tilemap.get(17),
      tilemap.get(18),
      tilemap.get(19)
    );

    this.paper = new PaperBoard(new Vector(0, 0), size);

    this.addChild(this.board);
    this.addChild(this.paper);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
