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
    const tilemap = assets['Paper'].tilemaps['Paper'];

    const ts = new Text(text);

    this.slice = new Layout3Slice(
      ts.width + 6,
      tilemap.get(1),
      tilemap.get(2),
      tilemap.get(3)
    );

    this.addChild(this.slice);

    ts.position = new Vector(3, 3);

    this.addChild(ts);
  }

  setHighlight(highlight: boolean): void {
    this.slice.fillColor = highlight ? '#ffffff' : undefined;
    this.slice.opacity = highlight ? 0.8 : 1;
    this.depth = highlight ? 10 : 5;
  }

  override get width() {
    return this.slice.width;
  }

  override get height() {
    return this.slice.height;
  }
}
