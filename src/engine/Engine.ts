import { IRenderer } from '@engine/renderer';
import { EventEmitter, Scene, Vector } from './core';
import { InputDevice } from './input';
import { RapierPhysicsSimulation } from './physics';
import SceneLoadedEvent from './SceneLoadedEvent';

export default class Engine extends EventEmitter {
  constructor(
    public readonly viewport: Vector,
    private renderer: IRenderer,
    private physicsSimulation: RapierPhysicsSimulation,
    private inputDevices: InputDevice[]
  ) {
    super();
    renderer.setViewport(viewport);
    physicsSimulation.setViewport(viewport);
  }

  loadScene(scene: Scene) {
    this.renderer.setRootElement(scene);
    this.physicsSimulation.setRootElement(scene);
    this.inputDevices.forEach(inputDevice => inputDevice.setRootElement(scene));

    this.handleEvent(new SceneLoadedEvent(scene));
  }

  start(maxRenderFps: number, maxPhysicsFps: number): void {
    this.renderer.start(maxRenderFps);
    this.physicsSimulation.start(maxPhysicsFps);
  }
}
