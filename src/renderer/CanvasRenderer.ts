import { Element, Query, WorkLoop } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import { TickEvent } from '@engine/events';
import IRenderer from './IRenderer';

export default class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private rootElement?: Element;
  private workLoop: WorkLoop;

  constructor(container: HTMLElement, width: number, height: number) {
    this.workLoop = new WorkLoop(this.render.bind(this));

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
    this.workLoop.start(maxFps);
  }

  private render(currentTime: number) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.rootElement) {
      return;
    }

    this.rootElement.dispatchEvent(new TickEvent(currentTime));

    for (const item of Query.childrenByType(CanvasItem, this.rootElement)) {
      item.draw(this.context);
    }
  }
}
