import { Element } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import { TickEvent } from '@engine/renderer';
import { PhysicsTickEvent } from '@engine/physics';
import FpsCounter from './FpsCounter';

export default class Debugger extends CanvasItem {
  private previousScene: Element | undefined;
  private renderFpsCounter = new FpsCounter();
  private physicsFpsCounter = new FpsCounter();

  constructor() {
    super();

    this.on(TickEvent, this.onTick.bind(this), true);
    this.on(PhysicsTickEvent, this.onPhysicsTick.bind(this), true);
  }

  attachToScene(scene: Element) {
    if (this.previousScene) {
      this.previousScene.removeChild(this);
    }

    scene.addChild(this);
    this.previousScene = scene;
  }

  private onTick(event: TickEvent) {
    this.renderFpsCounter.advance(event.currentTime);
  }

  private onPhysicsTick(event: TickEvent) {
    this.physicsFpsCounter.advance(event.currentTime);
  }

  override draw(context: CanvasRenderingContext2D) {
    context.fillText(
      `${this.renderFpsCounter.fps.toFixed(0)} / ${this.physicsFpsCounter.fps.toFixed(0)}`,
      0,
      12
    );
  }
}
