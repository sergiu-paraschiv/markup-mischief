import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import { CanvasItem, Node2D } from '@engine/elements';
import { TickEvent } from '@engine/renderer';
import { DebugLine, PhysicsTickEvent } from '@engine/physics';
import { MouseMoveEvent } from '@engine/input';
import FpsCounter from './FpsCounter';

export default class Debugger extends CanvasItem {
  private debugLayer: HTMLDivElement;
  private engine: Engine | undefined;
  private previousScene: Element | undefined;
  private renderFpsCounter = new FpsCounter();
  private physicsFpsCounter = new FpsCounter();
  private debugLines: DebugLine[] = [];
  private _enablePhysicsDebugLines = false;
  private _enableGridLines = false;
  private _enableFps = false;
  private _enableHoverHighlight = false;
  private hoveredObject: Node2D | undefined;

  constructor(container: HTMLElement) {
    super();

    this.debugLayer = document.createElement('div');
    this.debugLayer.style.position = 'absolute';
    this.debugLayer.style.top = '20px';
    this.debugLayer.style.left = '20px';
    this.debugLayer.style.padding = '4px';
    this.debugLayer.style.background = 'red';
    container.appendChild(this.debugLayer);

    this.on(TickEvent, this.onTick.bind(this));
    this.on(PhysicsTickEvent, this.onPhysicsTick.bind(this));
    this.on(MouseMoveEvent, this.onMouseMove.bind(this));
  }

  set enablePhysicsDebugLines(enable: boolean) {
    this._enablePhysicsDebugLines = enable;
  }

  set enableGridLines(enable: boolean) {
    this._enableGridLines = enable;
  }

  set enableFps(enable: boolean) {
    this._enableFps = enable;
  }

  set enableHoverHighlight(enable: boolean) {
    this._enableHoverHighlight = enable;
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

    scene.addChild(this, 999);
    this.previousScene = scene;
  }

  private onTick(event: TickEvent) {
    if (this._enableFps) {
      this.renderFpsCounter.advance(event.currentTime);
    }
  }

  private onPhysicsTick(event: PhysicsTickEvent) {
    if (this._enableFps) {
      this.physicsFpsCounter.advance(event.currentTime);
    }

    if (this._enablePhysicsDebugLines) {
      this.debugLines = event.simulation.getDebugInformation();
    }
  }

  private onMouseMove(event: MouseMoveEvent) {
    if (!this._enableHoverHighlight || !this.previousScene) {
      this.hoveredObject = undefined;
      return;
    }

    this.hoveredObject = this.getObjectAt(event.point);
  }

  private getObjectAt(point: Vector): Node2D | undefined {
    if (!this.previousScene) {
      return undefined;
    }

    const objects = Query.childrenByType(Node2D, this.previousScene);

    // Search from top to bottom (reverse order for z-index)
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const left = obj.position.left;
      const right = obj.position.left + obj.width;
      const top = obj.position.top;
      const bottom = obj.position.top + obj.height;

      if (
        left <= point.x &&
        point.x <= right &&
        top <= point.y &&
        point.y <= bottom
      ) {
        return obj;
      }
    }

    return undefined;
  }

  override draw(context: CanvasRenderingContext2D) {
    if (this._enableGridLines) {
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
    }

    if (this._enableFps) {
      const newText = `${this.renderFpsCounter.fps.toFixed(0)} / ${this.physicsFpsCounter.fps.toFixed(0)}`;
      if (this.debugLayer.innerText !== newText) {
        this.debugLayer.innerText = newText;
      }
    }

    if (this._enablePhysicsDebugLines) {
      for (const line of this.debugLines) {
        context.beginPath();
        context.strokeStyle = line.color;
        context.moveTo(line.from.x, line.from.y);
        context.lineTo(line.to.x, line.to.y);
        context.stroke();
      }
    }

    if (this._enableHoverHighlight && this.hoveredObject) {
      const obj = this.hoveredObject;
      context.beginPath();
      context.strokeStyle = '#00ff00';
      context.lineWidth = 2;
      context.rect(obj.position.left, obj.position.top, obj.width, obj.height);
      context.stroke();
      context.lineWidth = 1;
    }
  }
}
