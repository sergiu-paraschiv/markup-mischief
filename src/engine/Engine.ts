import { IRenderer } from '@renderer';
import { Scene } from './core';

export default class Engine {
  constructor(private renderer: IRenderer) {}

  loadScene(scene: Scene) {
    this.renderer.loadScene(scene);
  }

  start(fps: number): void {
    this.renderer.start(fps);
  }
}
