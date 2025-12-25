import { Vector } from '@engine/core';
import { Node2D, Sprite, SpriteMash, SpriteMashData } from '@engine/elements';
import { Texture } from '@engine/loaders';
import { drawHTML } from 'rasterizehtml';

import SolutionBoardData from './SolutionBoard.json';

export default class HtmlPreview extends Node2D {
  private htmlContent: string;
  private previewCanvas: HTMLCanvasElement;
  private board: SpriteMash;
  private sprite: Sprite;
  private padding = new Vector(10, 10);

  constructor(position: Vector, html: string) {
    super();
    this.position = position;
    this.htmlContent = html;

    this.board = SpriteMash.fromData(SolutionBoardData as SpriteMashData);

    // Create an off-screen canvas for rendering HTML
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = this.drawWidth;
    this.previewCanvas.height = this.drawHeight;

    // Create a sprite with an empty texture initially
    this.sprite = new Sprite(Texture.empty(), this.padding);

    this.board.addChild(this.sprite);

    this.addChild(this.board);

    // Trigger initial render
    this.renderHtml();
  }

  public async renderHtml(): Promise<void> {
    const ctx = this.previewCanvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, this.drawWidth, this.drawHeight);

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
        width: this.drawWidth,
        height: this.drawHeight,
        executeJs: false,
      });

      // Convert canvas to ImageBitmap
      const imageBitmap = await createImageBitmap(this.previewCanvas);

      // Create texture from ImageBitmap
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
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }

  private get drawWidth() {
    return this.width - this.padding.width * 2;
  }

  private get drawHeight() {
    return this.height - this.padding.height * 2;
  }
}
