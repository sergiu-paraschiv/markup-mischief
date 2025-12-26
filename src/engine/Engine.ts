import { CanvasRenderer } from '@engine/renderer';
import { EventEmitter, Scene, Vector } from './core';
import { InputDevice } from './input';
import { PhysicsSimulation } from './physics';
import SceneLoadedEvent from './SceneLoadedEvent';

export default class Engine extends EventEmitter {
  constructor(
    public readonly viewport: Vector,
    public readonly renderer: CanvasRenderer,
    private physicsSimulation: PhysicsSimulation,
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
