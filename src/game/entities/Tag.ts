import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import type { DeviceInfo } from '@engine/utils';
import { DynamicBody } from '@engine/physics';
import HighResText from './HighResText';
import Layout3Slice from './Layout3Slice';

export default class Tag extends DynamicBody {
  private slice: Layout3Slice;
  private _initialDepth: number | undefined;

  constructor(
    initialPosition: Vector,
    public readonly text: string,
    public readonly tagType: 'html' | 'css' = 'html'
  ) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap = assets['Paper'].tilemaps['Paper'];

    const ts = new HighResText(text, {
      fontFamily: '"Source Code Pro", monospace',
      fontWeight: '700',
      color: '#000000',
    });

    // Scale up buttons on mobile devices for better touch targets
    const deviceInfo = GlobalContext.get<DeviceInfo>('deviceInfo');
    if (deviceInfo?.isMobile) {
      ts.scale = new Vector(1.7, 1.7);
    }

    this.slice = new Layout3Slice(
      ts.width + 4,
      tilemap.get(1),
      tilemap.get(2),
      tilemap.get(3)
    );

    this.addChild(this.slice);

    ts.position = new Vector(2, 2);

    this.addChild(ts);
  }

  setHighlight(highlight: boolean): void {
    this.slice.fillColor = highlight ? '#ffffff' : undefined;
    this.slice.opacity = highlight ? 0.8 : 1;

    if (this._initialDepth === undefined) {
      this._initialDepth = this.depth;
    }

    this.depth = highlight ? this._initialDepth + 5 : this._initialDepth;
  }

  override get width() {
    return this.slice.width;
  }

  override get height() {
    return this.slice.height;
  }
}
