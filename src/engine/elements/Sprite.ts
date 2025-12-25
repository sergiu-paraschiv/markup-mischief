import { Vector, Element } from '@engine/core';
import { Texture } from '@engine/loaders';
import Node2D from './Node2D';

export default class Sprite extends Node2D {
  private _meta: object | undefined;
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

  override get width() {
    return this._texture.width;
  }

  override get height() {
    return this._texture.height;
  }

  withMeta(meta: object | undefined) {
    this._meta = meta;
  }

  getMeta() {
    return this._meta;
  }
}
