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

  override draw(context: CanvasRenderingContext2D) {
    const needsTempCanvas = this.hasTextureClipMask();

    if (needsTempCanvas) {
      // Draw to temporary canvas for texture mask clipping
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this._texture.width;
      tempCanvas.height = this._texture.height;
      const tempContext = tempCanvas.getContext('2d');

      if (!tempContext) return;

      const filledTexture = this.applyFillColorToTexture(
        this._texture.data,
        this._texture.width,
        this._texture.height
      );

      tempContext.drawImage(filledTexture || this._texture.data, 0, 0);

      // Apply texture masks
      const maskedCanvas = this.applyTextureClipMasks(tempCanvas, {
        x: Math.floor(this.position.x),
        y: Math.floor(this.position.y),
        width: this._texture.width,
        height: this._texture.height,
      });

      context.save();
      this.applyRectangleClips(context);

      if (this.opacity < 1.0) {
        context.globalAlpha = this.opacity;
      }

      context.drawImage(
        maskedCanvas,
        Math.floor(this.position.x),
        Math.floor(this.position.y)
      );

      context.restore();
    } else {
      // Original path with rectangle clipping only
      context.save();

      this.applyRectangleClips(context);

      if (this.opacity < 1.0) {
        context.globalAlpha = this.opacity;
      }

      const filledTexture = this.applyFillColorToTexture(
        this._texture.data,
        this._texture.width,
        this._texture.height
      );

      context.drawImage(
        filledTexture || this._texture.data,
        Math.floor(this.position.x),
        Math.floor(this.position.y)
      );

      context.restore();
    }
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
