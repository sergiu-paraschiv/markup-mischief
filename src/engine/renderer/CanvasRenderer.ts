import { Element, Query, Vector, WorkLoop } from '@engine/core';
import {
  CanvasItem,
  Sprite,
  AnimatedSprite,
  ClipMask,
  ClipRegion,
  isCanvasItemClipMask,
} from '@engine/elements';
import IRenderer from './IRenderer';
import TickEvent from './TickEvent';

export default class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private rootElement?: Element;
  private workLoop: WorkLoop;

  constructor(
    canvas: HTMLCanvasElement,
    private zoom: number
  ) {
    this.workLoop = new WorkLoop(this.render.bind(this));

    this.canvas = canvas;
    this.canvas.style.display = 'block';
    this.canvas.style.imageRendering = 'pixelated';

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('CanvasRenderingContext2D could not be obtained!');
    }

    this.context = context;
    this.context.imageSmoothingEnabled = false;
  }

  setViewport(viewport: Vector): void {
    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;
    this.canvas.style.width = viewport.width * this.zoom + 'px';
    this.canvas.style.height = viewport.height * this.zoom + 'px';
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  getElement(): HTMLElement {
    return this.canvas;
  }

  globalToLocalPoint(point: Vector): Vector {
    let x = point.x;
    let y = point.y;

    const containerRect = this.canvas.getBoundingClientRect();
    x -= containerRect.left;
    y -= containerRect.top;

    return new Vector(Math.round(x / this.zoom), Math.round(y / this.zoom));
  }

  localToGlobalPoint(point: Vector): Vector {
    return new Vector(point.x * this.zoom, point.y * this.zoom);
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  private hasCanvasItemClipMask(
    clipRegion: ClipMask | ClipMask[] | undefined
  ): boolean {
    if (!clipRegion) return false;
    const masks = Array.isArray(clipRegion) ? clipRegion : [clipRegion];
    return masks.some(mask => isCanvasItemClipMask(mask));
  }

  private createTempCanvas(
    width: number,
    height: number
  ): {
    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
  } {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D context for temporary canvas');
    }

    return { canvas, context };
  }

  private applyRectangleClips(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    clipRegion: ClipMask | ClipMask[] | undefined
  ) {
    if (!clipRegion) return;

    const masks = Array.isArray(clipRegion) ? clipRegion : [clipRegion];
    const rectangles = masks.filter(
      (mask): mask is ClipRegion => !isCanvasItemClipMask(mask)
    );

    if (rectangles.length > 0) {
      context.beginPath();
      for (const region of rectangles) {
        context.rect(region.x, region.y, region.width, region.height);
      }
      context.clip();
    }
  }

  private applyCanvasItemClipMasks(
    canvas: CanvasImageSource,
    clipRegion: ClipMask | ClipMask[] | undefined,
    bounds: { x: number; y: number; width: number; height: number }
  ): CanvasImageSource {
    if (!clipRegion || !this.hasCanvasItemClipMask(clipRegion)) {
      return canvas;
    }

    const masks = Array.isArray(clipRegion) ? clipRegion : [clipRegion];
    const canvasItemMasks = masks.filter(mask => isCanvasItemClipMask(mask));

    if (canvasItemMasks.length === 0) {
      return canvas;
    }

    // Create a mask canvas
    const { canvas: maskCanvas, context: maskContext } = this.createTempCanvas(
      bounds.width,
      bounds.height
    );

    // Render all CanvasItem masks onto the mask canvas
    // We need to translate the entire mask canvas to account for the bounds offset
    maskContext.save();
    maskContext.translate(-bounds.x, -bounds.y);

    for (const canvasItemMask of canvasItemMasks) {
      if (isCanvasItemClipMask(canvasItemMask)) {
        // Render the CanvasItem at its natural position
        // The item already has the correct absolute position
        this.renderCanvasItem(maskContext, canvasItemMask.item);
      }
    }

    maskContext.restore();

    // Create result canvas
    const { canvas: resultCanvas, context: resultContext } =
      this.createTempCanvas(bounds.width, bounds.height);

    // Draw the original content
    resultContext.drawImage(canvas, 0, 0);

    // Apply the mask using destination-in
    resultContext.globalCompositeOperation = 'destination-in';
    resultContext.drawImage(maskCanvas, 0, 0);

    return resultCanvas;
  }

  private renderCanvasItem(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    item: CanvasItem
  ): void {
    if (!item.isVisible) {
      return;
    }

    // Handle Sprite and AnimatedSprite rendering
    if (item instanceof AnimatedSprite) {
      this.drawAnimatedSprite(context, item);
    } else if (item instanceof Sprite) {
      this.drawSprite(context, item);
    } else {
      // Fall back to default draw method for other CanvasItem types
      item.draw(context);
    }

    // Recursively render children
    const children = Query.childrenByType(CanvasItem, item, false);
    for (const child of children) {
      this.renderCanvasItem(context, child);
    }
  }

  private applyFillColorToTexture(
    imageSource: CanvasImageSource,
    width: number,
    height: number,
    fillColor: string | undefined
  ): CanvasImageSource | null {
    if (!fillColor) {
      return null;
    }

    const { canvas: tempCanvas, context: tempContext } = this.createTempCanvas(
      width,
      height
    );

    // Draw the image
    tempContext.drawImage(imageSource, 0, 0);

    // Apply fill color using source-in
    tempContext.globalCompositeOperation = 'source-in';
    tempContext.fillStyle = fillColor;
    tempContext.fillRect(0, 0, width, height);

    return tempCanvas;
  }

  private drawTextureWithTransforms(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    textureData: CanvasImageSource,
    position: Vector,
    width: number,
    height: number,
    opacity: number,
    fillColor: string | undefined,
    clipRegion: ClipMask | ClipMask[] | undefined,
    flipH = false,
    flipV = false
  ) {
    const needsCanvasItemMask = this.hasCanvasItemClipMask(clipRegion);

    if (needsCanvasItemMask) {
      // Path with CanvasItem mask clipping: render to temp canvas first
      const { canvas: tempCanvas, context: tempContext } =
        this.createTempCanvas(width, height);

      // Apply fill color and draw to temp canvas
      const filledTexture = this.applyFillColorToTexture(
        textureData,
        width,
        height,
        fillColor
      );
      const imageSource = filledTexture || textureData;

      // Apply flip transforms if needed
      if (flipH || flipV) {
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        tempContext.scale(scaleX, scaleY);
        tempContext.drawImage(
          imageSource,
          scaleX * 0,
          0,
          scaleX * width,
          height
        );
      } else {
        tempContext.drawImage(imageSource, 0, 0);
      }

      // Apply CanvasItem masks
      const maskedCanvas = this.applyCanvasItemClipMasks(
        tempCanvas,
        clipRegion,
        {
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          width,
          height,
        }
      );

      // Draw to final context with opacity and rectangle clips
      context.save();
      this.applyRectangleClips(context, clipRegion);

      if (opacity < 1.0) {
        context.globalAlpha = opacity;
      }

      context.drawImage(
        maskedCanvas,
        Math.floor(position.x),
        Math.floor(position.y)
      );

      context.restore();
    } else {
      // Fast path with rectangle clipping only
      context.save();

      this.applyRectangleClips(context, clipRegion);

      if (opacity < 1.0) {
        context.globalAlpha = opacity;
      }

      // Apply fill color
      const filledTexture = this.applyFillColorToTexture(
        textureData,
        width,
        height,
        fillColor
      );
      const imageSource = filledTexture || textureData;

      // Apply flip transforms and draw
      if (flipH || flipV) {
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        context.scale(scaleX, scaleY);
        context.drawImage(
          imageSource,
          scaleX * Math.floor(position.x),
          Math.floor(position.y),
          scaleX * width,
          height
        );
      } else {
        context.drawImage(
          imageSource,
          Math.floor(position.x),
          Math.floor(position.y)
        );
      }

      context.restore();
    }
  }

  private drawSprite(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    sprite: Sprite
  ) {
    const texture = sprite.texture;
    this.drawTextureWithTransforms(
      context,
      texture.data,
      sprite.position,
      texture.width,
      texture.height,
      sprite.opacity,
      sprite.fillColor,
      sprite.clipRegion
    );
  }

  private drawAnimatedSprite(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    sprite: AnimatedSprite
  ) {
    const frame = sprite.currentFrame;
    if (!frame) return;

    const texture = frame.texture;
    this.drawTextureWithTransforms(
      context,
      texture.data,
      sprite.position,
      texture.width,
      texture.height,
      sprite.opacity,
      sprite.fillColor,
      sprite.clipRegion,
      sprite.flipH,
      sprite.flipV
    );
  }

  private render(currentTime: number) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.rootElement) {
      return;
    }

    this.rootElement.dispatchEvent(new TickEvent(currentTime));

    for (const item of Query.childrenByType(
      CanvasItem,
      this.rootElement,
      true
    )) {
      if (!item.isVisible) {
        continue;
      }

      // Handle Sprite and AnimatedSprite rendering in CanvasRenderer
      if (item instanceof AnimatedSprite) {
        this.drawAnimatedSprite(this.context, item);
      } else if (item instanceof Sprite) {
        this.drawSprite(this.context, item);
      } else {
        // Fall back to default draw method for other CanvasItem types
        item.draw(this.context);
      }
    }
  }
}
