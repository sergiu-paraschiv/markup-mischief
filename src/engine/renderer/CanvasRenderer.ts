import { Element, Query, Vector, WorkLoop } from '@engine/core';
import {
  CanvasItem,
  Sprite,
  AnimatedSprite,
  ClipMask,
  ClipRegion,
  isCanvasItemClipMask,
} from '@engine/elements';
import TickEvent from './TickEvent';
import { globalCanvasPool, type CanvasPurpose } from './CanvasPool';

export default class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private rootElement?: Element;
  private workLoop: WorkLoop;

  // Render statistics (current frame)
  private renderCount = 0;
  private cacheHitCount = 0;

  // Previous frame statistics (for external queries)
  private prevRenderCount = 0;
  private prevCacheHitCount = 0;

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

  getRenderStats() {
    return {
      renderCount: this.prevRenderCount,
      cacheHitCount: this.prevCacheHitCount,
    };
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
    height: number,
    purpose?: CanvasPurpose
  ): {
    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
  } {
    return globalCanvasPool.getCanvas(width, height, purpose);
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
        // Treat clipRegion as relative to sprite position (0,0 = top-left of sprite)
        context.rect(region.x, region.y, region.width, region.height);
      }
      context.clip();
    }
  }

  private applyRectangleClipsToCanvas(
    canvas: CanvasImageSource,
    clipRegion: ClipMask | ClipMask[] | undefined,
    width: number,
    height: number
  ): CanvasImageSource {
    if (!clipRegion) return canvas;

    const masks = Array.isArray(clipRegion) ? clipRegion : [clipRegion];
    const rectangles = masks.filter(
      (mask): mask is ClipRegion => !isCanvasItemClipMask(mask)
    );

    if (rectangles.length === 0) return canvas;

    // Create new canvas (not pooled - returned to caller)
    const resultCanvas = new OffscreenCanvas(width, height);
    const resultContext = resultCanvas.getContext('2d');

    if (!resultContext) {
      throw new Error('Failed to get 2D context for rectangle clip canvas');
    }

    resultContext.imageSmoothingEnabled = false;

    resultContext.save();
    resultContext.beginPath();
    for (const region of rectangles) {
      // Clip regions are relative to sprite (0,0 = top-left of sprite)
      resultContext.rect(region.x, region.y, region.width, region.height);
    }
    resultContext.clip();

    // Draw the source canvas with clipping applied
    resultContext.drawImage(canvas, 0, 0);
    resultContext.restore();

    return resultCanvas;
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

    // Create a mask canvas (pooled - used immediately)
    const { canvas: maskCanvas, context: maskContext } = this.createTempCanvas(
      bounds.width,
      bounds.height,
      'mask'
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

    // Create result canvas (not pooled - returned to caller)
    const resultCanvas = new OffscreenCanvas(bounds.width, bounds.height);
    const resultContext = resultCanvas.getContext('2d');

    if (!resultContext) {
      throw new Error('Failed to get 2D context for clip mask result canvas');
    }

    resultContext.imageSmoothingEnabled = false;

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

    // Increment render count for this item
    this.renderCount++;

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

    // Create a new canvas (not pooled) because the caller will hold onto this
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D context for fill color canvas');
    }

    context.imageSmoothingEnabled = false;

    // Draw the image
    context.drawImage(imageSource, 0, 0);

    // Apply fill color using source-in
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = fillColor;
    context.fillRect(0, 0, width, height);

    return canvas;
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
    flipV = false,
    scale: Vector = new Vector(1, 1)
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
        const flipScaleX = flipH ? -1 : 1;
        const flipScaleY = flipV ? -1 : 1;
        tempContext.scale(flipScaleX, flipScaleY);
        tempContext.drawImage(
          imageSource,
          flipScaleX * 0,
          0,
          flipScaleX * width,
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

      // Calculate scaled dimensions
      const scaledWidth = width * scale.x;
      const scaledHeight = height * scale.y;

      // Draw to final context with opacity, scale, and rectangle clips
      context.save();
      this.applyRectangleClips(context, clipRegion);

      if (opacity < 1.0) {
        context.globalAlpha = opacity;
      }

      context.drawImage(
        maskedCanvas,
        Math.floor(position.x),
        Math.floor(position.y),
        scaledWidth,
        scaledHeight
      );

      context.restore();
    } else {
      // Check if we actually have rectangle clipping to apply
      const masks = clipRegion
        ? Array.isArray(clipRegion)
          ? clipRegion
          : [clipRegion]
        : [];
      const rectangles = masks.filter(
        (mask): mask is ClipRegion => !isCanvasItemClipMask(mask)
      );
      const hasRectangleClip = rectangles.length > 0;

      if (hasRectangleClip) {
        // Path with rectangle clipping: render to temp canvas, apply clip, then draw result
        const { canvas: tempCanvas, context: tempContext } =
          this.createTempCanvas(width, height);

        // Apply fill color
        const filledTexture = this.applyFillColorToTexture(
          textureData,
          width,
          height,
          fillColor
        );
        const imageSource = filledTexture || textureData;

        // Apply flip transforms if needed
        if (flipH || flipV) {
          const flipScaleX = flipH ? -1 : 1;
          const flipScaleY = flipV ? -1 : 1;
          tempContext.scale(flipScaleX, flipScaleY);
          tempContext.drawImage(
            imageSource,
            flipScaleX * 0,
            0,
            flipScaleX * width,
            height
          );
        } else {
          tempContext.drawImage(imageSource, 0, 0);
        }

        // Apply rectangle clips to the temp canvas
        const clippedCanvas = this.applyRectangleClipsToCanvas(
          tempCanvas,
          clipRegion,
          width,
          height
        );

        // Calculate scaled dimensions
        const scaledWidth = width * scale.x;
        const scaledHeight = height * scale.y;

        // Draw final result with opacity and scale
        context.save();
        if (opacity < 1.0) {
          context.globalAlpha = opacity;
        }

        context.drawImage(
          clippedCanvas,
          Math.floor(position.x),
          Math.floor(position.y),
          scaledWidth,
          scaledHeight
        );

        context.restore();
      } else {
        // Fast path with no clipping - draw directly
        context.save();

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

        // Calculate scaled dimensions
        const scaledWidth = width * scale.x;
        const scaledHeight = height * scale.y;

        // Apply flip transforms and draw with scale
        if (flipH || flipV) {
          const flipScaleX = flipH ? -1 : 1;
          const flipScaleY = flipV ? -1 : 1;
          context.translate(Math.floor(position.x), Math.floor(position.y));
          context.scale(flipScaleX, flipScaleY);
          context.drawImage(
            imageSource,
            0,
            0,
            flipScaleX * scaledWidth,
            flipScaleY * scaledHeight
          );
        } else {
          context.drawImage(
            imageSource,
            Math.floor(position.x),
            Math.floor(position.y),
            scaledWidth,
            scaledHeight
          );
        }

        context.restore();
      }
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
      sprite.clipRegion,
      false,
      false,
      sprite.scale
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
      sprite.flipV,
      sprite.scale
    );
  }

  private render(currentTime: number) {
    // Save previous frame's statistics before resetting
    this.prevRenderCount = this.renderCount;
    this.prevCacheHitCount = this.cacheHitCount;

    // Reset render statistics for this frame
    this.renderCount = 0;
    this.cacheHitCount = 0;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.rootElement) {
      return;
    }

    this.rootElement.dispatchEvent(new TickEvent(currentTime));

    // Use skipInvisible optimization to avoid traversing invisible subtrees
    for (const item of Query.childrenByType(
      CanvasItem,
      this.rootElement,
      true,
      true
    )) {
      if (!item.isVisible) {
        continue;
      }

      if (item.cacheable) {
        this.cacheHitCount++;
      }

      // Increment render count
      this.renderCount++;

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

    // Release all temp canvases after rendering is complete
    globalCanvasPool.releaseAll();
  }
}
