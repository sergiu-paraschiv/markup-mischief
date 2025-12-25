import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { Node2D } from '@engine/elements';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

export default class Button extends Node2D {
  private background: Layout3Slice;

  constructor(
    initialPosition: Vector,
    public readonly text: string
  ) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');

    const ts = new Text(text);

    this.background = new Layout3Slice(
      ts.width + 12,
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(2),
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(3),
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(4)
    );

    this.addChild(this.background);

    ts.position = new Vector(6, 4);

    this.addChild(ts);
  }

  override get width() {
    return this.background.width;
  }

  override get height() {
    return this.background.height;
  }
}
