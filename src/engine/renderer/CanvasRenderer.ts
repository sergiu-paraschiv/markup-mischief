import { Element, Query, Vector, WorkLoop } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import IRenderer from './IRenderer';
import TickEvent from './TickEvent';

export default class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private rootElement?: Element;
  private workLoop: WorkLoop;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly zoom: number
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
      item.draw(this.context);
    }
  }
}
