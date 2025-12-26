import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

import PaperBoard from './PaperBoard';

export default class SecondaryBoard extends Node2D {
  private board: Node2D;
  private paper: Node2D;

  constructor(position: Vector, size: Vector) {
    super(position);

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    this.board = new Layout9Slice(
      size,
      tilemap.get(5),
      tilemap.get(6),
      tilemap.get(7),
      tilemap.get(13),
      tilemap.get(14),
      tilemap.get(15),
      tilemap.get(21),
      tilemap.get(22),
      tilemap.get(23)
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
