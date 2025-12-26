import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { DynamicBody } from '@engine/physics';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

export default class Tag extends DynamicBody {
  constructor(
    initialPosition: Vector,
    public readonly text: string,
    public readonly tagType: 'html' | 'css' = 'html'
  ) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');

    const ts = new Text(text);

    this.addChild(
      new Layout3Slice(
        ts.width + 6,
        assets['Paper'].tilemaps['Paper'].get(1),
        assets['Paper'].tilemaps['Paper'].get(2),
        assets['Paper'].tilemaps['Paper'].get(3)
      )
    );

    ts.position = new Vector(3, 3);

    this.addChild(ts);
  }
}
