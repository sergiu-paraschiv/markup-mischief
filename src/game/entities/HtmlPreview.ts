import { drawHTML } from 'rasterizehtml';
import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';

export default class HtmlPreview extends Node2D {
  private _size: Vector;
  private htmlContent: string;
  private cssContent: string;
  private previewCanvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(position: Vector, size: Vector, html: string, css = '') {
    super();
    this._size = size;
    this.position = position;
    this.htmlContent = html;
    this.cssContent = css;

    this.previewCanvas = document.createElement('canvas');

    // Set internal canvas resolution (4x for high-res rendering)
    this.previewCanvas.width = this.width * 4;
    this.previewCanvas.height = this.height * 4;

    // Set display size to match Node2D dimensions
    this.previewCanvas.style.width = this.width + 'px';
    this.previewCanvas.style.height = this.height + 'px';

    // Make canvas transparent and remove borders
    this.previewCanvas.style.background = 'transparent';
    this.previewCanvas.style.border = 'none';

    this.previewCanvas.style.pointerEvents = 'none';
    this.previewCanvas.style.imageRendering = 'crisp-edges';

    const context = this.previewCanvas.getContext('2d');
    if (!context) {
      throw new Error('Could not obtain off-screen canvas context');
    }
    this.context = context;
    this.attachedDOM = this.previewCanvas;

    // Trigger initial render
    this.renderHtml();
  }

  public async renderHtml(): Promise<void> {
    // Clear the canvas (using internal resolution)
    this.context.clearRect(
      0,
      0,
      this.previewCanvas.width,
      this.previewCanvas.height
    );

    const finalHTML = this.htmlContent.replaceAll(
      '<img/>',
      '<img src="/sample-img.png" />'
    );

    // Wrap HTML in a minimal document with basic styling
    // Scale all dimensions by 4x to match internal canvas resolution
    const scale = 4;
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: ${16 * scale}px;
              font-family: Arial, sans-serif;
              font-size: ${12 * scale}px;
              line-height: 1.4;
            }

            a {
              color: blue;
              text-decoration: underline;
            }

            img {
              width: ${50 * scale}px;
              height: ${50 * scale}px;
              border: ${1 * scale}px solid #000000;
            }
            
            button {
              font-size: ${12 * scale}px;
              line-height: 1.4;
            }

            /* User-provided CSS */
            ${this.cssContent}
          </style>
        </head>
        <body>${finalHTML}</body>
      </html>
    `;

    try {
      // Use internal resolution for high-quality rendering
      await drawHTML(wrappedHtml, this.previewCanvas, {
        width: this.previewCanvas.width,
        height: this.previewCanvas.height,
        executeJs: false,
      });
    } catch (error) {
      console.error('Error rendering HTML with rasterizehtml:', error);
    }
  }

  public setHtml(html: string, css = ''): void {
    if (this.htmlContent !== html || this.cssContent !== css) {
      this.htmlContent = html;
      this.cssContent = css;
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
