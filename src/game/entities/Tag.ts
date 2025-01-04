import { Vector } from '@engine/core';
import { DynamicBody } from '@engine/physics';
import Text from './Text';
import Captain from './Captain';

export default class Tag extends DynamicBody {
  constructor(initialPosition: Vector, text: string) {
    super(initialPosition);
    this.addChild(new Text(text));
    this.canSleep = false;

    this.filterCollisionFn = ({ collider }) => {
      if (collider instanceof Captain) {
        return false;
      }
      return true;
    };
  }
}
