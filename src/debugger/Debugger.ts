import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import { CanvasItem, Node2D } from '@engine/elements';
import { LayoutFlex } from '@game/entities';
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
  private _enableFlexDebugLines = false;
  private hoveredObject: Node2D | undefined;
  public gridSize = new Vector(32, 32);

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

  set enableFlexDebugLines(enable: boolean) {
    this._enableFlexDebugLines = enable;
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

      for (
        let x = this.gridSize.width;
        x < VIEWPORT_WIDTH;
        x += this.gridSize.width
      ) {
        context.beginPath();
        context.strokeStyle = 'rgba(0, 0, 0, 0.2';
        context.moveTo(x, 0);
        context.lineTo(x, VIEWPORT_HEIGHT);
        context.stroke();
      }

      for (
        let y = this.gridSize.height;
        y < VIEWPORT_HEIGHT;
        y += this.gridSize.height
      ) {
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

    if (this._enableFlexDebugLines && this.previousScene) {
      this.drawFlexDebugLines(context);
    }
  }

  private drawFlexDebugLines(context: CanvasRenderingContext2D) {
    if (!this.previousScene) return;

    const flexContainers = Query.childrenByType(LayoutFlex, this.previousScene);

    for (const container of flexContainers) {
      const containerPos = container.position;
      const containerX = containerPos.x;
      const containerY = containerPos.y;
      const containerWidth = container.width;
      const containerHeight = container.height;

      // Draw container boundary in blue
      context.beginPath();
      context.strokeStyle = '#0088ff';
      context.lineWidth = 2;
      context.rect(containerX, containerY, containerWidth, containerHeight);
      context.stroke();

      // Draw flex direction indicator
      context.fillStyle = '#0088ff';
      context.font = '10px monospace';
      const directionText = `${container.flexDirection} | ${container.justifyContent} | ${container.alignItems}`;
      context.fillText(directionText, containerX + 4, containerY + 12);

      // Draw children boundaries in orange
      const children = container.children.filter(
        child => child instanceof Node2D
      ) as Node2D[];

      for (const child of children) {
        const childPos = child.position;
        const childX = childPos.x;
        const childY = childPos.y;

        context.beginPath();
        context.strokeStyle = '#ff8800';
        context.lineWidth = 1;
        context.rect(childX, childY, child.width, child.height);
        context.stroke();

        // Draw cross indicating the origin/position point
        context.beginPath();
        context.strokeStyle = '#ff0000';
        context.lineWidth = 1;
        context.moveTo(childX - 3, childY);
        context.lineTo(childX + 3, childY);
        context.moveTo(childX, childY - 3);
        context.lineTo(childX, childY + 3);
        context.stroke();
      }

      // Draw gap indicators if gap > 0
      if (container.gap > 0 && children.length > 1) {
        const isRow = container.flexDirection === 'row';
        context.strokeStyle = '#ff00ff';
        context.lineWidth = 1;
        context.setLineDash([2, 2]);

        for (let i = 0; i < children.length - 1; i++) {
          const child = children[i];
          const nextChild = children[i + 1];
          const childPos = child.position;
          const nextChildPos = nextChild.position;

          if (isRow) {
            const gapStart = childPos.x + child.width;
            const gapEnd = nextChildPos.x;
            const gapY = containerY + containerHeight / 2;

            context.beginPath();
            context.moveTo(gapStart, gapY);
            context.lineTo(gapEnd, gapY);
            context.stroke();
          } else {
            const gapStart = childPos.y + child.height;
            const gapEnd = nextChildPos.y;
            const gapX = containerX + containerWidth / 2;

            context.beginPath();
            context.moveTo(gapX, gapStart);
            context.lineTo(gapX, gapEnd);
            context.stroke();
          }
        }

        context.setLineDash([]);
      }

      context.lineWidth = 1;
    }
  }
}
