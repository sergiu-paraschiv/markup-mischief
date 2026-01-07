import { GlobalContext, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { Layout9Slice } from '@game/entities';
import { AssetsMap } from '@engine/loaders';

import PaperBoard, { PaperBoardVariant } from './PaperBoard';

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
  private board: Node2D | undefined;
  public readonly paper: Node2D | undefined;
  private variant: BoardVariant;
  private outlined: boolean;
  private paperVariant: PaperBoardVariant | 'none';
  private overlayElements: Node2D[] = [];

  constructor(
    position: Vector,
    size: Vector,
    variant: BoardVariant = 'primary',
    outlined = false,
    paperVariant: PaperBoardVariant | 'none' = 'default'
  ) {
    super(position);
    this.variant = variant;
    this.outlined = outlined;
    this.paperVariant = paperVariant;

    this.createBoard(size);

    if (paperVariant !== 'none') {
      // Create paper overlay
      this.paper = new PaperBoard(new Vector(0, 0), size, paperVariant);
      this.addChild(this.paper);
    }
  }

  private createBoard(size: Vector): void {
    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap =
      assets['Wood and Paper UI - Boards'].tilemaps['Wood and Paper'];

    const tiles = TILE_INDEXES[this.variant];

    // Create outline if requested
    if (this.outlined) {
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
    this.addChild(this.board);
  }

  override get width() {
    return this.board?.width ?? 0;
  }

  override get height() {
    return this.board?.height ?? 0;
  }

  /**
   * Add an overlay element that will always render on top of the board
   */
  public addOverlay(element: Node2D): void {
    this.overlayElements.push(element);
    this.addChild(element);
  }

  /**
   * Update the board size by recreating the Layout9Slice
   */
  public setSize(newSize: Vector): void {
    // Remove old board and outline if they exist
    if (this.board) {
      this.removeChild(this.board);
    }
    if (this.outline) {
      this.removeChild(this.outline);
    }

    // Recreate board with new size
    this.createBoard(newSize);

    // Resize paper if it exists
    if (this.paper && this.paper instanceof PaperBoard) {
      this.paper.setSize(newSize);
    }

    // Re-add overlay elements to ensure they render on top
    for (const overlay of this.overlayElements) {
      this.removeChild(overlay);
      this.addChild(overlay);
    }
  }
}
