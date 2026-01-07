import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import { CanvasItem, Node2D } from '@engine/elements';
import { FixedSizeLayoutFlex } from '@game/entities';
import { TickEvent } from '@engine/renderer';
import { DebugLine, PhysicsTickEvent } from '@engine/physics';
import { MouseMoveEvent } from '@engine/input';
import FpsCounter from './FpsCounter';
import RenderGraph from './RenderGraph';

export default class Debugger extends CanvasItem {
  private graphCanvas: HTMLCanvasElement;
  private graphContext: CanvasRenderingContext2D;
  private engine: Engine | undefined;
  private previousScene: Element | undefined;
  private renderFpsCounter = new FpsCounter();
  private physicsFpsCounter = new FpsCounter();
  private renderGraph = new RenderGraph();
  private cacheHitGraph = new RenderGraph();
  private renderFpsGraph = new RenderGraph();
  private physicsFpsGraph = new RenderGraph();
  private debugLines: DebugLine[] = [];
  private _enablePhysicsDebugLines = false;
  private _enableGridLines = false;
  private _enableHoverHighlight = false;
  private _enableFlexDebugLines = false;
  private _enableRenderGraph = false;
  private hoveredObject: Node2D | undefined;
  public gridSize = new Vector(32, 32);

  constructor(container: HTMLElement) {
    super();

    // Create separate canvas for render graph
    this.graphCanvas = document.createElement('canvas');
    this.graphCanvas.style.position = 'absolute';
    this.graphCanvas.style.top = '50px';
    this.graphCanvas.style.left = '20px';
    this.graphCanvas.style.display = 'none';
    this.graphCanvas.width = 260;
    this.graphCanvas.height = 480;
    this.graphCanvas.style.imageRendering = 'pixelated';
    container.appendChild(this.graphCanvas);

    const context = this.graphCanvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context for graph canvas');
    }
    this.graphContext = context;
    this.graphContext.imageSmoothingEnabled = false;

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

  set enableHoverHighlight(enable: boolean) {
    this._enableHoverHighlight = enable;
  }

  set enableFlexDebugLines(enable: boolean) {
    this._enableFlexDebugLines = enable;
  }

  set enableRenderGraph(enable: boolean) {
    this._enableRenderGraph = enable;
    this.graphCanvas.style.display = enable ? 'block' : 'none';
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

    scene.addChild(this, 99999);
    this.previousScene = scene;
  }

  private onTick(event: TickEvent) {
    if (this._enableRenderGraph) {
      this.renderFpsCounter.advance(event.currentTime);
    }

    if (this._enableRenderGraph && this.engine) {
      const stats = this.engine.renderer.getRenderStats();
      this.renderGraph.addSample(stats.renderCount);
      this.cacheHitGraph.addSample(stats.cacheHitCount);
      this.renderFpsGraph.addSample(this.renderFpsCounter.fps);

      // Draw graphs on separate canvas
      this.drawRenderGraphs();
    }
  }

  private onPhysicsTick(event: PhysicsTickEvent) {
    if (this._enableRenderGraph) {
      this.physicsFpsCounter.advance(event.currentTime);
    }

    if (this._enableRenderGraph) {
      this.physicsFpsGraph.addSample(this.physicsFpsCounter.fps);
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

  private drawRenderGraphs() {
    // Clear the graph canvas
    this.graphContext.clearRect(
      0,
      0,
      this.graphCanvas.width,
      this.graphCanvas.height
    );

    const graphWidth = 240;
    const graphHeight = 80;
    const graphMargin = 10;
    const graphSpacing = 25;

    let currentY = graphMargin;

    // Draw render FPS graph
    this.graphContext.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.graphContext.font = '12px monospace';
    this.graphContext.fillText('Render FPS', graphMargin, currentY + 2);
    currentY += 12;

    this.renderFpsGraph.draw(
      this.graphContext,
      graphMargin,
      currentY,
      graphWidth,
      graphHeight
    );
    currentY += graphHeight + graphSpacing;

    // Draw physics FPS graph
    this.graphContext.fillText('Physics FPS', graphMargin, currentY + 2);
    currentY += 12;

    this.physicsFpsGraph.draw(
      this.graphContext,
      graphMargin,
      currentY,
      graphWidth,
      graphHeight
    );
    currentY += graphHeight + graphSpacing;

    // Draw render count graph
    this.graphContext.fillText('Renders/Frame', graphMargin, currentY + 2);
    currentY += 12;

    this.renderGraph.draw(
      this.graphContext,
      graphMargin,
      currentY,
      graphWidth,
      graphHeight
    );
    currentY += graphHeight + graphSpacing;

    // Draw cache hit graph
    this.graphContext.fillText('Cache Hits/Frame', graphMargin, currentY + 2);
    currentY += 12;

    this.cacheHitGraph.draw(
      this.graphContext,
      graphMargin,
      currentY,
      graphWidth,
      graphHeight
    );
  }

  private drawFlexDebugLines(context: CanvasRenderingContext2D) {
    if (!this.previousScene) return;

    const flexContainers = Query.childrenByType(
      FixedSizeLayoutFlex,
      this.previousScene
    );

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
