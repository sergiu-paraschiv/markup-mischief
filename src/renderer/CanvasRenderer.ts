import { Scene, Query } from '@engine/core';
import { Sprite } from '@engine/elements';
import { TickEvent } from '@engine/events';
import IRenderer from './IRenderer';

export default class CanvasRenderer implements IRenderer {
  private scene?: Scene;
  private fps: number;
  private frameCount: number;
  private startTime: number;
  private then: number;
  private now: number;
  private currentFps: number;

  constructor(
    private context: CanvasRenderingContext2D,
    private canvas: HTMLCanvasElement
  ) {
    this.fps = 10;
    this.frameCount = 0;
    this.startTime = 0;
    this.then = 0;
    this.now = 0;
    this.currentFps = 0;
  }

  loadScene(scene: Scene): void {
    this.scene = scene;
  }

  start(fps: number): void {
    this.fps = fps;
    this.then = window.performance.now();
    this.startTime = this.then;
    this.renderLoop();
  }

  private renderLoop() {
    requestAnimationFrame(this.renderLoop.bind(this));

    this.now = window.performance.now();
    const elapsed = this.now - this.then;
    const fpsInterval = 1000 / this.fps;

    if (elapsed > fpsInterval) {
      this.then = this.now - (elapsed % fpsInterval);

      this.render(elapsed);

      const sinceStart = this.now - this.startTime;
      this.currentFps =
        Math.round((1000 / (sinceStart / ++this.frameCount)) * 100) / 100;
    }
  }

  private render(elapsedTime: number) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.scene) {
      return;
    }

    this.scene.dispatchEvent(new TickEvent(elapsedTime));

    for (const sprite of Query.childrenByType(Sprite, this.scene)) {
      this.context.drawImage(
        sprite.texture.data,
        sprite.position.x,
        sprite.position.y
      );
    }

    this.context.font = '12px sans-serif';
    this.context.fillStyle = 'red';
    this.context.fillText(this.currentFps.toString(10), 0, this.canvas.height);
  }
}
