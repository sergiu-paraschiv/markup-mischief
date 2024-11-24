import { Element, Query } from '@engine/core';
import { Sprite } from '@engine/elements';
import { TickEvent } from '@engine/events';
import IRenderer from './IRenderer';

export default class CanvasRenderer implements IRenderer {
  private rootElement?: Element;
  private maxFps: number;
  private fpsInterval: number;
  private frameCount: number;
  private startTime: number;
  private previousTime: number;
  private currentFps: number;

  constructor(
    private context: CanvasRenderingContext2D,
    private canvas: HTMLCanvasElement
  ) {
    this.maxFps = 10;
    this.fpsInterval = this.computeFpsInterval();
    this.frameCount = 0;
    this.startTime = 0;
    this.previousTime = 0;
    this.currentFps = 0;
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

    for (const sprite of Query.childrenByType(Sprite, this.rootElement)) {
      this.context.drawImage(
        sprite.texture.data,
        sprite.position.x,
        sprite.position.y
      );
    }

    this.context.fillText(this.currentFps.toString(10), 0, this.canvas.height);
  }

  private computeFpsInterval() {
    return 1000 / this.maxFps;
  }
}
