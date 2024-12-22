import { Vector, Element } from '@engine/core';
import { Texture } from '@engine/loaders';
import Node2D from './Node2D';

export default class Sprite extends Node2D {
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

  override draw(): [CanvasImageSource, number, number] {
    return [this._texture.data, this.position.x, this.position.y];
  }
}
