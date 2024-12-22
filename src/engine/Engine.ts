import { IRenderer } from '@renderer';
import { Scene } from './core';
import { InputDevice } from './input';
import { IPhysicsSimulation } from './physics';

export default class Engine {
  constructor(
    private renderer: IRenderer,
    private physicsSimulation: IPhysicsSimulation,
    private inputDevices: InputDevice[]
  ) {}

  loadScene(scene: Scene) {
    this.renderer.setRootElement(scene);
    this.physicsSimulation.setRootElement(scene);
    this.inputDevices.forEach(inputDevice => inputDevice.setRootElement(scene));
  }

  start(maxRenderFps: number, maxPhysicsFps: number): void {
    this.renderer.start(maxRenderFps);
    this.physicsSimulation.start(maxPhysicsFps);
  }
}
