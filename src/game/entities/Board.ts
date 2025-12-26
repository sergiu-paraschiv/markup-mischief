import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

import PaperBoard from './PaperBoard';

type BoardVariant = 'primary' | 'secondary';

const TILE_INDEXES = {
  primary: {
    topLeft: 1,
    topCenter: 2,
    topRight: 3,
    middleLeft: 9,
    middleCenter: 10,
    middleRight: 11,
    bottomLeft: 17,
    bottomCenter: 18,
    bottomRight: 19,
  },
  secondary: {
    topLeft: 5,
    topCenter: 6,
    topRight: 7,
    middleLeft: 13,
    middleCenter: 14,
    middleRight: 15,
    bottomLeft: 21,
    bottomCenter: 22,
    bottomRight: 23,
  },
};

export default class Board extends Node2D {
  private outline?: Node2D;
  private board: Node2D;
  private paper: Node2D;

  constructor(
    position: Vector,
    size: Vector,
    variant: BoardVariant = 'primary',
    outlined = false
  ) {
    super(position);

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    const tiles = TILE_INDEXES[variant];

    // Create outline if requested
    if (outlined) {
      const outlineThicknessX = 1;
      const outlineThicknessY = 2;
      const scaledSize = new Vector(
        size.width + outlineThicknessX * 2,
        size.height + outlineThicknessY * 2
      );
      const outlineOffset = new Vector(-outlineThicknessX, -outlineThicknessY);

      this.outline = new Layout9Slice(
        scaledSize,
        tilemap.get(tiles.topLeft),
        tilemap.get(tiles.topCenter),
        tilemap.get(tiles.topRight),
        tilemap.get(tiles.middleLeft),
        tilemap.get(tiles.middleCenter),
        tilemap.get(tiles.middleRight),
        tilemap.get(tiles.bottomLeft),
        tilemap.get(tiles.bottomCenter),
        tilemap.get(tiles.bottomRight)
      );
      this.outline.position = outlineOffset;
      this.outline.fillColor = 'rgba(0, 0, 0, 0.3)';

      this.addChild(this.outline);
    }

    // Create main board
    this.board = new Layout9Slice(
      size,
      tilemap.get(tiles.topLeft),
      tilemap.get(tiles.topCenter),
      tilemap.get(tiles.topRight),
      tilemap.get(tiles.middleLeft),
      tilemap.get(tiles.middleCenter),
      tilemap.get(tiles.middleRight),
      tilemap.get(tiles.bottomLeft),
      tilemap.get(tiles.bottomCenter),
      tilemap.get(tiles.bottomRight)
    );

    // Create paper overlay
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
