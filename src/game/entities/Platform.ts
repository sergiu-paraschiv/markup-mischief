import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { StaticBody } from '@engine/physics';
import Layout3Slice from './Layout3Slice';

export default class Platform extends StaticBody {
  private readonly gfx: Layout3Slice;

  constructor(
    position: Vector,
    private readonly _size: Vector
  ) {
    super(position);

    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap = assets['Pirate Ship'].tilemaps['Platforms'];

    this.gfx = new Layout3Slice(
      this.width,
      tilemap.get(51),
      tilemap.get(52),
      tilemap.get(50)
    );
    this.gfx.position = new Vector(0, -2);

    this.addChild(this.gfx);
  }

  override get width() {
    return this._size?.width || 0;
  }

  override get height() {
    return this._size?.height || 0;
  }
}
