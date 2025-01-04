import { Vector } from '@engine/core';
import { DynamicBody } from '@engine/physics';
import { Assets } from '@game';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

export default class Tag extends DynamicBody {
  constructor(
    initialPosition: Vector,
    public readonly text: string
  ) {
    super(initialPosition);

    const ts = new Text(text);

    this.addChild(
      new Layout3Slice(
        ts.width + 6,
        Assets.tilemap['Paper'].get(1),
        Assets.tilemap['Paper'].get(2),
        Assets.tilemap['Paper'].get(3)
      )
    );

    ts.position = new Vector(3, 3);

    this.addChild(ts);

    this.canSleep = false;
  }
}
