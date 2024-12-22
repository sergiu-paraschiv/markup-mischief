import { IRenderer } from '@renderer';
import { Scene } from './core';
import { InputDevice } from './input';

export default class Engine {
  constructor(
    private renderer: IRenderer,
    private inputDevices: InputDevice[]
  ) {}

  loadScene(scene: Scene) {
    this.renderer.setRootElement(scene);
    this.inputDevices.forEach(inputDevice => inputDevice.setRootElement(scene));
  }

  start(maxRenderFps: number): void {
    this.renderer.start(maxRenderFps);
  }
}
