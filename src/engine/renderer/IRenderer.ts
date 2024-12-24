import { Element, Vector } from '@engine/core';

export default interface IRenderer {
  setViewport(viewport: Vector): void;
  setRootElement(element: Element): void;
  start(fps: number): void;
}
