import { Element, Vector } from '@engine/core';

export default interface IRenderer {
  getElement(): HTMLElement;
  setViewport(viewport: Vector): void;
  setRootElement(element: Element): void;
  start(fps: number): void;
  globalToLocalPoint(point: Vector): Vector;
  localToGlobalPoint(point: Vector): Vector;
}
