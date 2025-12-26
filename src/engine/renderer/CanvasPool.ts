export type CanvasPurpose =
  | 'default' // Standard rendering - needs full reset
  | 'cache'
  | 'fill-color' // Fill color operation - will set composite op
  | 'mask' // Masking operation - will set transform and composite op
  | 'clip' // Clipping operation - will set clip region
  | 'result'; // Result composition - will set composite op

interface PooledCanvas {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  inUse: boolean;
  lastPurpose?: CanvasPurpose;
}

/**
 * Global canvas pool for temporary canvases to reduce allocations
 * Supports multiple canvases per size to avoid conflicts when multiple are needed simultaneously
 * Uses purpose-based keying to minimize expensive state resets
 */
class CanvasPool {
  private pool = new Map<string, PooledCanvas[]>();
  private readonly maxCanvasesPerSize = 10;

  /**
   * Get a temporary canvas from the pool
   * Returns a canvas with clean state ready for use
   *
   * @param width Canvas width
   * @param height Canvas height
   * @param purpose Optional purpose hint to optimize state reuse
   */
  getCanvas(
    width: number,
    height: number,
    purpose: CanvasPurpose = 'default'
  ): {
    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
  } {
    // Include purpose in key for better reuse patterns
    const key = `${width}x${height}:${purpose}`;
    let canvases = this.pool.get(key);

    if (!canvases) {
      canvases = [];
      this.pool.set(key, canvases);
    }

    // Find an available canvas in the pool with matching purpose
    for (const pooled of canvases) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        pooled.lastPurpose = purpose;
        const ctx = pooled.context;

        // Minimal reset based on purpose
        // Most operations will set their own state anyway
        switch (purpose) {
          case 'fill-color':
          case 'result':
            // These operations set their own composite op, just clear
            ctx.clearRect(0, 0, width, height);
            break;

          case 'mask':
            // Masks use transforms and composite ops, reset everything
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, width, height);
            break;

          case 'clip':
            // Clipping sets its own clip region, reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, width, height);
            break;

          case 'default':
          default:
            // Full reset for default/unknown purposes
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, width, height);
            break;
        }

        return { canvas: pooled.canvas, context: pooled.context };
      }
    }

    // No available canvas, create a new one
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D context for temporary canvas');
    }

    context.imageSmoothingEnabled = false;

    const pooledCanvas: PooledCanvas = {
      canvas,
      context,
      inUse: true,
      lastPurpose: purpose,
    };

    // Add to pool if this size doesn't have too many canvases yet
    if (canvases.length < this.maxCanvasesPerSize) {
      canvases.push(pooledCanvas);
    }

    return { canvas, context };
  }

  /**
   * Release a specific canvas back to the pool
   */
  releaseCanvas(canvas: OffscreenCanvas): void {
    for (const canvases of this.pool.values()) {
      for (const pooled of canvases) {
        if (pooled.canvas === canvas) {
          pooled.inUse = false;
          return;
        }
      }
    }
  }

  /**
   * Release all canvases back to the pool
   * Should be called at the end of each render frame
   */
  releaseAll(): void {
    for (const canvases of this.pool.values()) {
      for (const pooled of canvases) {
        pooled.inUse = false;
      }
    }
  }

  /**
   * Reset canvas context to clean state
   */
  private resetCanvas(
    ctx: OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // Reset to identity transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear the entire canvas
    ctx.clearRect(0, 0, width, height);

    // Reset all context properties to defaults
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
  }

  /**
   * Get statistics about the pool
   */
  getStats(): { totalCanvases: number; inUse: number; available: number } {
    let totalCanvases = 0;
    let inUse = 0;

    for (const canvases of this.pool.values()) {
      totalCanvases += canvases.length;
      inUse += canvases.filter(c => c.inUse).length;
    }

    return {
      totalCanvases,
      inUse,
      available: totalCanvases - inUse,
    };
  }
}

// Global singleton instance
export const globalCanvasPool = new CanvasPool();
