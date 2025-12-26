import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { DynamicBody } from '@engine/physics';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

export default class Tag extends DynamicBody {
  private slice: Layout3Slice;

  constructor(
    initialPosition: Vector,
    public readonly text: string,
    public readonly tagType: 'html' | 'css' = 'html'
  ) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');

    const ts = new Text(text);

    this.slice = new Layout3Slice(
      ts.width + 6,
      assets['Paper'].tilemaps['Paper'].get(1),
      assets['Paper'].tilemaps['Paper'].get(2),
      assets['Paper'].tilemaps['Paper'].get(3)
    );

    this.addChild(this.slice);

    ts.position = new Vector(3, 3);

    this.addChild(ts);
  }

  override get width() {
    return this.slice.width;
  }

  override get height() {
    return this.slice.height;
  }
}
