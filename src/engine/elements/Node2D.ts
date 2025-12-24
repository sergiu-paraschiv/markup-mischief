import { Vector, Element, Query } from '@engine/core';
import { CanvasItem } from '@engine/renderer';
import { Texture } from '@engine/loaders';

export interface ClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextureClipMask {
  mask: Texture;
  position: Vector;
}

export type ClipMask = ClipRegion | TextureClipMask;

export default class Node2D extends CanvasItem {
  private _position: Vector;
  private _translation: Vector;
  private _opacity = 1.0;
  public fillColor: string | undefined = undefined;
  public clipRegion: ClipMask | ClipMask[] | undefined = undefined;

  constructor(position?: Vector, children?: Element[]) {
    super(children);

    this._position = position || new Vector();
    this._translation = new Vector();
  }

  get opacity(): number {
    let accumulatedOpacity = this._opacity;
    const parent = Query.parentByType(Node2D, this);
    if (parent) {
      accumulatedOpacity *= parent.opacity;
    }
    return accumulatedOpacity;
  }

  set opacity(value: number) {
    this._opacity = value;
  }

  get position() {
    const ownPosition = this._position.add(this._translation);
    const positionedParent = Query.parentByType(Node2D, this);
    if (positionedParent) {
      return positionedParent.position.add(ownPosition);
    }
    return ownPosition;
  }

  set position(newPosition: Vector) {
    this._position = newPosition;
  }

  set translation(newTranslation: Vector) {
    this._translation = newTranslation;
  }

  private isTextureClipMask(mask: ClipMask): mask is TextureClipMask {
    return 'mask' in mask && 'position' in mask;
  }

  protected hasTextureClipMask(): boolean {
    if (!this.clipRegion) return false;
    const masks = Array.isArray(this.clipRegion)
      ? this.clipRegion
      : [this.clipRegion];
    return masks.some(mask => this.isTextureClipMask(mask));
  }

  protected applyRectangleClips(context: CanvasRenderingContext2D) {
    if (!this.clipRegion) return;

    const masks = Array.isArray(this.clipRegion)
      ? this.clipRegion
      : [this.clipRegion];

    const rectangles = masks.filter(
      (mask): mask is ClipRegion => !this.isTextureClipMask(mask)
    );

    if (rectangles.length > 0) {
      context.beginPath();
      for (const region of rectangles) {
        context.rect(region.x, region.y, region.width, region.height);
      }
      context.clip();
    }
  }

  protected applyTextureClipMasks(
    canvas: HTMLCanvasElement,
    bounds: { x: number; y: number; width: number; height: number }
  ): HTMLCanvasElement {
    if (!this.clipRegion || !this.hasTextureClipMask()) {
      return canvas;
    }

    const masks = Array.isArray(this.clipRegion)
      ? this.clipRegion
      : [this.clipRegion];

    const textureMasks = masks.filter(mask => this.isTextureClipMask(mask));

    if (textureMasks.length === 0) {
      return canvas;
    }

    // Create a mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = bounds.width;
    maskCanvas.height = bounds.height;
    const maskContext = maskCanvas.getContext('2d');

    if (!maskContext) {
      return canvas;
    }

    // Draw all texture masks onto the mask canvas
    for (const textureMask of textureMasks) {
      if (this.isTextureClipMask(textureMask)) {
        maskContext.drawImage(
          textureMask.mask.data,
          textureMask.position.x - bounds.x,
          textureMask.position.y - bounds.y
        );
      }
    }

    // Create result canvas
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = bounds.width;
    resultCanvas.height = bounds.height;
    const resultContext = resultCanvas.getContext('2d');

    if (!resultContext) {
      return canvas;
    }

    // Draw the original content
    resultContext.drawImage(canvas, 0, 0);

    // Apply the mask using destination-in
    resultContext.globalCompositeOperation = 'destination-in';
    resultContext.drawImage(maskCanvas, 0, 0);

    return resultCanvas;
  }

  protected applyFillColorToTexture(
    imageSource: CanvasImageSource,
    width: number,
    height: number
  ): HTMLCanvasElement | null {
    if (!this.fillColor) {
      return null;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d');

    if (!tempContext) {
      return null;
    }

    // Draw the image
    tempContext.drawImage(imageSource, 0, 0);

    // Apply fill color using source-in
    tempContext.globalCompositeOperation = 'source-in';
    tempContext.fillStyle = this.fillColor;
    tempContext.fillRect(0, 0, width, height);

    return tempCanvas;
  }

  /**
   * Renders this node and its children to a texture
   */
  renderToTexture(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    // Temporarily store original position
    const originalPos = this._position;

    // Set position to 0,0 for rendering
    this._position = new Vector(0, 0);

    // Draw this node and children
    const items = Query.childrenByType(CanvasItem, this, true);
    for (const item of items) {
      if (item.isVisible) {
        item.draw(context);
      }
    }

    // Restore original position
    this._position = originalPos;

    return { canvas, context };
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get width() {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get height() {
    return 0;
  }
}
