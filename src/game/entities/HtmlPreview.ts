import { drawHTML } from 'rasterizehtml';
import { Vector } from '@engine/core';
import { Node2D, Sprite } from '@engine/elements';
import { Texture } from '@engine/loaders';

export default class HtmlPreview extends Node2D {
  private _size: Vector;
  private htmlContent: string;
  private previewCanvas: OffscreenCanvas;
  private context: OffscreenCanvasRenderingContext2D;
  private sprite: Sprite;

  constructor(position: Vector, size: Vector, html: string) {
    super();
    this._size = size;
    this.position = position;
    this.htmlContent = html;

    // Create an off-screen canvas for rendering HTML
    this.previewCanvas = new OffscreenCanvas(this.width, this.height);
    const context = this.previewCanvas.getContext('2d');
    if (!context) {
      throw new Error('Could not obtain off-screen canvas context');
    }
    this.context = context;

    this.sprite = new Sprite(Texture.empty());

    this.addChild(this.sprite);

    // Trigger initial render
    this.renderHtml();
  }

  public async renderHtml(): Promise<void> {
    // Clear the canvas
    this.context.clearRect(0, 0, this.width, this.height);

    // Wrap HTML in a minimal document with basic styling
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 8px;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            
            a {
              color: blue;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>${this.htmlContent}</body>
      </html>
    `;

    try {
      await drawHTML(wrappedHtml, this.previewCanvas, {
        width: this.width,
        height: this.height,
        executeJs: false,
      });

      const imageBitmap = await createImageBitmap(this.previewCanvas);
      const texture = Texture.fromImageBitmap(imageBitmap);

      // Update the sprite's texture
      this.sprite.texture = texture;
    } catch (error) {
      console.error('Error rendering HTML with rasterizehtml:', error);
    }
  }

  public setHtml(html: string): void {
    if (this.htmlContent !== html) {
      this.htmlContent = html;
      this.renderHtml();
    }
  }

  override get width() {
    return this._size.width;
  }

  override get height() {
    return this._size.height;
  }
}
