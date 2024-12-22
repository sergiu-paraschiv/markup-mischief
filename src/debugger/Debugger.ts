import { Element } from '@engine/core';
import { CanvasItem } from '@engine/elements';
import { TickEvent } from '@engine/renderer';
import { DebugLine, PhysicsTickEvent } from '@engine/physics';
import FpsCounter from './FpsCounter';

export default class Debugger extends CanvasItem {
  private previousScene: Element | undefined;
  private renderFpsCounter = new FpsCounter();
  private physicsFpsCounter = new FpsCounter();
  private debugLines: DebugLine[] = [];

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

  private onPhysicsTick(event: PhysicsTickEvent) {
    this.physicsFpsCounter.advance(event.currentTime);

    this.debugLines = event.simulation.getDebugInformation();
  }

  override draw(context: CanvasRenderingContext2D) {
    context.fillText(
      `${this.renderFpsCounter.fps.toFixed(0)} / ${this.physicsFpsCounter.fps.toFixed(0)}`,
      0,
      10
    );

    for (const line of this.debugLines) {
      context.beginPath();
      context.strokeStyle = line.color;
      context.moveTo(line.from.x, line.from.y);
      context.lineTo(line.to.x, line.to.y);
      context.stroke();
    }
  }
}
