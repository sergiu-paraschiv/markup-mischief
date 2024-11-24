import { Vector, Element } from '@engine/core';
import { Texture } from '@engine/loaders';
import PositionedElement from './PositionedElement';

export default class Sprite extends PositionedElement {
  private _texture = Texture.empty();

  constructor(texture?: Texture, position?: Vector, children?: Element[]) {
    super(position, children);

    if (texture) {
      this.texture = texture;
    }
  }

  get texture() {
    return this._texture;
  }

  set texture(texture: Texture) {
    this._texture = texture;
  }
}
