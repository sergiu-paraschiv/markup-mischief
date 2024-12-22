import { Element, Query } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import { TickEvent } from '@engine/events';
import IRenderer from './IRenderer';

export default class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private rootElement?: Element;
  private maxFps: number;
  private fpsInterval: number;
  private frameCount: number;
  private startTime: number;
  private previousTime: number;
  private currentFps: number;

  constructor(container: HTMLElement, width: number, height: number) {
    this.maxFps = 10;
    this.fpsInterval = this.computeFpsInterval();
    this.frameCount = 0;
    this.startTime = 0;
    this.previousTime = 0;
    this.currentFps = 0;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.display = 'block';
    this.canvas.style.width = width * 4 + 'px';
    this.canvas.style.height = height * 4 + 'px';
    this.canvas.style.imageRendering = 'pixelated';

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('CanvasRenderingContext2D could not be obtained!');
    }

    this.context = context;
    this.context.imageSmoothingEnabled = false;

    container.appendChild(this.canvas);
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  start(maxFps: number): void {
    this.maxFps = maxFps;
    this.fpsInterval = this.computeFpsInterval();
    this.previousTime = 0;
    this.startTime = 0;

    requestAnimationFrame(this.renderLoop.bind(this));
  }

  private renderLoop(currentTime: number) {
    if (this.startTime === 0) {
      this.startTime = currentTime;
    }

    const deltaTime = currentTime - this.previousTime;
    if (deltaTime >= this.fpsInterval) {
      this.previousTime = currentTime - (deltaTime % this.fpsInterval);

      this.render(currentTime);

      const sinceStart = currentTime - this.startTime;

      this.frameCount += 1;
      this.currentFps =
        Math.round((1000 / (sinceStart / this.frameCount)) * 100) / 100;

      // average FPS over the last 10 seconds only
      if (sinceStart >= 10000) {
        this.startTime = this.previousTime;
        this.frameCount = 0;
      }
    }

    requestAnimationFrame(this.renderLoop.bind(this));
  }

  private render(currentTime: number) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.rootElement) {
      return;
    }

    this.rootElement.dispatchEvent(new TickEvent(currentTime));

    for (const item of Query.childrenByType(CanvasItem, this.rootElement)) {
      const pixels = item.draw();
      if (pixels) {
        this.context.drawImage(...pixels);
      }
    }

    this.context.fillText(this.currentFps.toFixed(0), 0, this.canvas.height);
  }

  private computeFpsInterval() {
    return 1000 / this.maxFps;
  }
}
