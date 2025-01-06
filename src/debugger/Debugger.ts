import { Engine, SceneLoadedEvent } from '@engine';
import { Element } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import { TickEvent } from '@engine/renderer';
import { DebugLine, PhysicsTickEvent } from '@engine/physics';
import FpsCounter from './FpsCounter';

export default class Debugger extends CanvasItem {
  private debugLayer: HTMLDivElement;
  private engine: Engine | undefined;
  private previousScene: Element | undefined;
  private renderFpsCounter = new FpsCounter();
  private physicsFpsCounter = new FpsCounter();
  private debugLines: DebugLine[] = [];

  constructor(container: HTMLElement) {
    super();

    this.debugLayer = document.createElement('div');
    container.appendChild(this.debugLayer);

    this.on(TickEvent, this.onTick.bind(this));
    this.on(PhysicsTickEvent, this.onPhysicsTick.bind(this));
  }

  attachTo(engine: Engine) {
    this.engine = engine;
    engine.on(SceneLoadedEvent, event => {
      this.attachToScene(event.scene);
    });
  }

  private attachToScene(scene: Element) {
    if (this.previousScene) {
      this.previousScene.removeChild(this);
    }

    scene.addChild(this);
    this.previousScene = scene;
  }

  private onTick(event: TickEvent) {
    this.renderFpsCounter.advance(event.currentTime);
  }

  private onPhysicsTick(event: PhysicsTickEvent) {
    this.physicsFpsCounter.advance(event.currentTime);

    this.debugLines = event.simulation.getDebugInformation();
  }

  override draw(context: CanvasRenderingContext2D) {
    const VIEWPORT_WIDTH = this.engine?.viewport.width || 0;
    const VIEWPORT_HEIGHT = this.engine?.viewport.height || 0;

    const GRID_SIZE = 32;
    for (let x = GRID_SIZE; x < VIEWPORT_WIDTH; x += GRID_SIZE) {
      context.beginPath();
      context.strokeStyle = 'rgba(0, 0, 0, 0.2';
      context.moveTo(x, 0);
      context.lineTo(x, VIEWPORT_HEIGHT);
      context.stroke();
    }

    for (let y = GRID_SIZE; y < VIEWPORT_HEIGHT; y += GRID_SIZE) {
      context.beginPath();
      context.strokeStyle = 'rgba(0, 0, 0, 0.2';
      context.moveTo(0, y);
      context.lineTo(VIEWPORT_WIDTH, y);
      context.stroke();
    }

    context.beginPath();
    context.strokeStyle = '#ff0000';
    context.rect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    context.stroke();

    const newText = `${this.renderFpsCounter.fps.toFixed(0)} / ${this.physicsFpsCounter.fps.toFixed(0)}`;
    if (this.debugLayer.innerText !== newText) {
      this.debugLayer.innerText = newText;
    }

    for (const line of this.debugLines) {
      context.beginPath();
      context.strokeStyle = line.color;
      context.moveTo(line.from.x, line.from.y);
      context.lineTo(line.to.x, line.to.y);
      context.stroke();
    }
  }
}
