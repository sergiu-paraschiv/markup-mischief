import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

export type PaperBoardVariant = 'default' | 'white';

const TILE_INDEXES = {
  default: {
    topLeft: 33,
    topCenter: 34,
    topRight: 35,
    middleLeft: 45,
    middleCenter: 46,
    middleRight: 47,
    bottomLeft: 57,
    bottomCenter: 58,
    bottomRight: 59,
  },
  white: {
    topLeft: 41,
    topCenter: 42,
    topRight: 43,
    middleLeft: 53,
    middleCenter: 54,
    middleRight: 55,
    bottomLeft: 65,
    bottomCenter: 66,
    bottomRight: 67,
  },
};

export default class PaperBoard extends Node2D {
  private board: Node2D | undefined;
  private variant: PaperBoardVariant;

  constructor(
    position: Vector,
    size: Vector,
    variant: PaperBoardVariant = 'default'
  ) {
    super(position);
    this.variant = variant;

    this.createBoard(size);
  }

  private createBoard(size: Vector): void {
    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    const tiles = TILE_INDEXES[this.variant];

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

    this.addChild(this.board);
  }

  override get width() {
    return this.board?.width ?? 0;
  }

  override get height() {
    return this.board?.height ?? 0;
  }

  /**
   * Update the paper board size by recreating the Layout9Slice
   */
  public setSize(newSize: Vector): void {
    // Remove old board if it exists
    if (this.board) {
      this.removeChild(this.board);
    }

    // Recreate board with new size
    this.createBoard(newSize);
  }
}
