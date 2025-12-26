/**
 * Tracks and visualizes render count history as a graph
 */
export default class RenderGraph {
  private history: number[] = [];
  private readonly maxHistoryLength = 120; // 120 frames of history

  /**
   * Add a new render count sample
   */
  addSample(renderCount: number): void {
    this.history.push(renderCount);

    // Keep only the most recent samples
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Draw the graph on a canvas context
   */
  draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (this.history.length === 0) {
      return;
    }

    // Find max value for scaling
    const maxValue = Math.max(...this.history, 1);
    const minValue = Math.min(...this.history, 0);

    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(x, y, width, height);

    // Draw border
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 1;
    context.strokeRect(x, y, width, height);

    // Draw grid lines
    context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    context.beginPath();
    for (let i = 1; i < 4; i++) {
      const gridY = y + (height / 4) * i;
      context.moveTo(x, gridY);
      context.lineTo(x + width, gridY);
    }
    context.stroke();

    // Draw the graph line
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.beginPath();

    const pointWidth = width / this.maxHistoryLength;

    for (let i = 0; i < this.history.length; i++) {
      const value = this.history[i];
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const pointX = x + i * pointWidth;
      const pointY = y + height - normalized * height;

      if (i === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }

    context.stroke();

    // Draw labels
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.font = '10px monospace';
    context.fillText(`Max: ${maxValue.toFixed(0)}`, x + 4, y + 12);
    context.fillText(`Min: ${minValue.toFixed(0)}`, x + 4, y + height - 4);

    // Draw current value
    const currentValue = this.history[this.history.length - 1];
    context.fillText(
      `Current: ${currentValue.toFixed(0)}`,
      x + width - 80,
      y + 12
    );
  }

  /**
   * Clear the history
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Get the current value
   */
  get currentValue(): number {
    return this.history[this.history.length - 1] || 0;
  }

  /**
   * Get the average value over the history
   */
  get averageValue(): number {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((a, b) => a + b, 0);
    return sum / this.history.length;
  }
}
