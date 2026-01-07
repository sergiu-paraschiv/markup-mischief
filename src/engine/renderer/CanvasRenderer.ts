import { Element, Query, Vector, WorkLoop } from '@engine/core';
import {
  CanvasItem,
  Sprite,
  AnimatedSprite,
  ClipMask,
  ClipRegion,
  isCanvasItemClipMask,
  Node2D,
} from '@engine/elements';
import TickEvent from './TickEvent';
import { globalCanvasPool, type CanvasPurpose } from './CanvasPool';
import { globalRenderCache } from './RenderCache';

export default class CanvasRenderer {
  private rootDOM: HTMLElement;
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

  // Track attached DOM elements
  private attachedDOMElements = new Set<HTMLElement>();
  private maskElements = new Set<HTMLElement>();

  constructor(
    canvas: HTMLCanvasElement,
    rootDOM: HTMLElement,
    private zoom: number
  ) {
    this.workLoop = new WorkLoop(this.render.bind(this));

    this.rootDOM = rootDOM;
    this.rootDOM.style.isolation = 'isolate'; // Create stacking context for clipping

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
        this.renderCanvasItem(maskContext, canvasItemMask.item, true);
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
    item: CanvasItem,
    withChildren = false
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

    if (withChildren) {
      // Recursively render children
      const children = Query.childrenByType(CanvasItem, item, false);
      for (const child of children) {
        this.renderCanvasItem(context, child, withChildren);
      }
    }
  }

  private renderCachedItem(
    context: CanvasRenderingContext2D,
    item: Node2D,
    cacheKey: string
  ): void {
    // Try to get from cache
    const cachedCanvas = globalRenderCache.get(cacheKey);

    if (cachedCanvas) {
      // Cache hit - draw the cached canvas directly
      this.cacheHitCount++;

      // Draw the cached canvas at the item's position
      context.save();
      if (item.opacity < 1.0) {
        context.globalAlpha = item.opacity;
      }
      context.drawImage(
        cachedCanvas,
        Math.floor(item.position.x),
        Math.floor(item.position.y)
      );
      context.restore();

      return;
    }

    // Cache miss - render to temp canvas and cache it
    const width = item.width;
    const height = item.height;
    const { canvas: tempCanvas, context: tempContext } = this.createTempCanvas(
      width,
      height,
      'cache'
    );

    // Calculate the offset needed to make the computed position (0,0)
    // Since position getter adds parent position, we need to subtract it
    const originalPosition = item.ownPosition.clone();
    const parent = Query.parentByType(Node2D, item);
    const parentPos = parent ? parent.position : new Vector(0, 0);
    item.position = new Vector(0, 0).sub(parentPos);

    this.renderCanvasItem(tempContext, item, true);

    item.position = originalPosition;

    // Cache the rendered content
    globalRenderCache.set(cacheKey, tempCanvas, width, height);

    // Draw the newly cached canvas at the original position
    context.save();
    if (item.opacity < 1.0) {
      context.globalAlpha = item.opacity;
    }
    context.drawImage(
      tempCanvas,
      Math.floor(item.position.x),
      Math.floor(item.position.y)
    );
    context.restore();

    this.renderCount++;
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

    // Track which DOM elements are still in the render tree
    const visibleItemsWithDOM = new Set<HTMLElement>();

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

      if (item instanceof Node2D) {
        // Skip rendering if this item has a cacheable parent
        if (this.itemHasCachedParent(item)) {
          continue;
        }

        // Check if item is cacheable and has a cache key
        const cacheKey = item.cacheable ? item.cacheKey : undefined;

        if (cacheKey) {
          // Use cached rendering
          this.renderCachedItem(this.context, item, cacheKey);

          // Update DOM positioning if this item has attachedDOM
          this.updateDOMElementPosition(item);
          if (item.attachedDOM) {
            visibleItemsWithDOM.add(item.attachedDOM);
          }

          continue;
        }
      }

      this.renderCanvasItem(this.context, item, false);

      // Update DOM positioning if this item has attachedDOM
      this.updateDOMElementPosition(item);
      if (item.attachedDOM) {
        visibleItemsWithDOM.add(item.attachedDOM);
      }
    }

    // Clean up DOM elements that are no longer visible
    this.cleanupDetachedDOMElements(visibleItemsWithDOM);

    // Apply masking to hide elements behind masks
    this.applyMasking();

    // Release all temp canvases after rendering is complete
    globalCanvasPool.releaseAll();
  }

  itemHasCachedParent(item: Node2D): boolean {
    const parent = Query.parentByType(Node2D, item);

    if (!parent) {
      return false;
    }

    if (
      parent.cacheable &&
      parent.cacheKey &&
      globalRenderCache.get(parent.cacheKey)
    ) {
      return true;
    }

    return this.itemHasCachedParent(parent);
  }

  private updateDOMElementPosition(item: CanvasItem): void {
    if (!item.attachedDOM) {
      return;
    }

    const domElement = item.attachedDOM;
    const isMaskElement = domElement.hasAttribute('data-mask');
    const noAutoPosition = domElement.hasAttribute('data-no-auto-position');

    if (!this.attachedDOMElements.has(domElement)) {
      // Set up the DOM element for absolute positioning
      domElement.style.position = 'absolute';

      // Only append to rootDOM if element doesn't already have a parent
      // This allows form elements to contain input elements as children
      if (!domElement.parentElement) {
        this.rootDOM.appendChild(domElement);
      }

      this.attachedDOMElements.add(domElement);

      // Track if this is a mask element
      if (isMaskElement) {
        this.maskElements.add(domElement);
      }
    }

    // Skip positioning if element has data-no-auto-position attribute
    if (noAutoPosition) {
      // Still handle visibility
      if (item instanceof Node2D) {
        domElement.style.display = item.isVisible ? 'block' : 'none';
      }
      return;
    }

    // Get the item's position in canvas coordinates
    let canvasPosition = new Vector(0, 0);
    let width = 0;
    let height = 0;

    if (item instanceof Node2D) {
      canvasPosition = item.position;
      width = item.width;
      height = item.height;
    }

    // Get the canvas position on the page (accounts for flex centering)
    const canvasRect = this.canvas.getBoundingClientRect();
    const rootRect = this.rootDOM.getBoundingClientRect();

    // Convert canvas coordinates to screen coordinates
    const screenX =
      canvasPosition.x * this.zoom + canvasRect.left - rootRect.left;
    const screenY =
      canvasPosition.y * this.zoom + canvasRect.top - rootRect.top;

    // Apply the position to the DOM element
    domElement.style.left = `${screenX}px`;
    domElement.style.top = `${screenY}px`;

    // Store dimensions as data attributes for clip-path calculation
    if (isMaskElement) {
      domElement.dataset['maskX'] = screenX.toString();
      domElement.dataset['maskY'] = screenY.toString();
      domElement.dataset['maskWidth'] = (width * this.zoom).toString();
      domElement.dataset['maskHeight'] = (height * this.zoom).toString();
    }

    // Apply zoom scaling via transform
    domElement.style.transform = `scale(${this.zoom})`;
    domElement.style.transformOrigin = 'top left';

    // Handle visibility
    domElement.style.display = item.isVisible ? 'block' : 'none';
  }

  private cleanupDetachedDOMElements(
    visibleItemsWithDOM: Set<HTMLElement>
  ): void {
    // Remove DOM elements that are no longer in the render tree
    for (const domElement of this.attachedDOMElements) {
      if (!visibleItemsWithDOM.has(domElement)) {
        if (domElement.parentElement === this.rootDOM) {
          this.rootDOM.removeChild(domElement);
        }
        this.attachedDOMElements.delete(domElement);
        this.maskElements.delete(domElement);
      }
    }
  }

  private applyMasking(): void {
    // Build clip-path polygon that excludes mask element areas
    if (this.maskElements.size === 0) {
      // No masks, remove any existing clip-path from all elements
      for (const domElement of this.attachedDOMElements) {
        if (!domElement.hasAttribute('data-mask')) {
          domElement.style.clipPath = '';
          domElement.style.visibility = '';
        }
      }
      return;
    }

    // Build an array of mask rectangles
    const maskRects: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];

    for (const maskElement of this.maskElements) {
      if (maskElement.style.display === 'none') continue;

      const x = parseFloat(maskElement.dataset['maskX'] || '0');
      const y = parseFloat(maskElement.dataset['maskY'] || '0');
      const width = parseFloat(maskElement.dataset['maskWidth'] || '0');
      const height = parseFloat(maskElement.dataset['maskHeight'] || '0');

      maskRects.push({ x, y, width, height });
    }

    // Apply clip-path to all non-mask, non-interactive elements
    for (const domElement of this.attachedDOMElements) {
      if (domElement.hasAttribute('data-mask')) continue;
      if (domElement.hasAttribute('data-interactive')) continue;

      if (maskRects.length === 0) {
        domElement.style.clipPath = '';
        domElement.style.visibility = '';
        continue;
      }

      // Build a polygon that covers the entire viewport except mask areas
      // We'll create a polygon that goes around the full area, with cutouts for masks
      // For simplicity with multiple masks, we'll use CSS subtract() if supported
      // Otherwise fall back to polygon

      // Get element position from its style (before transform scaling)
      const elemStyleLeft = parseFloat(domElement.style.left || '0');
      const elemStyleTop = parseFloat(domElement.style.top || '0');

      // Get element's natural size (from its width/height style or content)
      const elemRect = domElement.getBoundingClientRect();
      // Divide by zoom to get the unscaled size
      const elemWidth = elemRect.width / this.zoom;
      const elemHeight = elemRect.height / this.zoom;

      const elemLeft = elemStyleLeft;
      const elemTop = elemStyleTop;
      const elemRight = elemLeft + elemWidth * this.zoom;
      const elemBottom = elemTop + elemHeight * this.zoom;

      // Check if element intersects with any mask
      let hasIntersection = false;
      for (const maskRect of maskRects) {
        const maskLeft = maskRect.x;
        const maskTop = maskRect.y;
        const maskRight = maskRect.x + maskRect.width;
        const maskBottom = maskRect.y + maskRect.height;

        if (
          elemLeft < maskRight &&
          elemRight > maskLeft &&
          elemTop < maskBottom &&
          elemBottom > maskTop
        ) {
          hasIntersection = true;
          // Calculate the intersection rectangle in root coordinates
          const intersectLeft = Math.max(elemLeft, maskLeft);
          const intersectTop = Math.max(elemTop, maskTop);
          const intersectRight = Math.min(elemRight, maskRight);
          const intersectBottom = Math.min(elemBottom, maskBottom);

          // Convert intersection to element-relative coordinates
          // Clip-path is applied before transform, so we need to use unscaled coordinates
          const clipLeft = (intersectLeft - elemLeft) / this.zoom;
          const clipTop = (intersectTop - elemTop) / this.zoom;
          const clipRight = (intersectRight - elemLeft) / this.zoom;
          const clipBottom = (intersectBottom - elemTop) / this.zoom;

          // Use polygon to exclude the intersecting area
          // Create a polygon that represents: full element minus intersection rectangle
          const polygon = `polygon(
            0% 0%,
            100% 0%,
            100% 100%,
            0% 100%,
            0% 0%,
            ${clipLeft}px ${clipTop}px,
            ${clipLeft}px ${clipBottom}px,
            ${clipRight}px ${clipBottom}px,
            ${clipRight}px ${clipTop}px,
            ${clipLeft}px ${clipTop}px
          )`;

          domElement.style.clipPath = polygon;
          break; // Only handle first intersection for now
        }
      }

      if (!hasIntersection) {
        domElement.style.clipPath = '';
        domElement.style.visibility = '';
      }
    }
  }
}
