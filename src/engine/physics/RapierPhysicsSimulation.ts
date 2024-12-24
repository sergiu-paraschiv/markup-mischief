import RAPIER from '@dimforge/rapier2d-compat';
import { Element, ElementAddedEvent, Vector, WorkLoop } from '@engine/core';
import PhysicsTickEvent from './PhysicsTickEvent';
import PhysicsBody from './PhysicsBody';

export interface DebugLine {
  from: Vector;
  to: Vector;
  color: string;
}

export default class RapierPhysicsSimulation {
  private viewport?: Vector;
  private rootElement?: Element;
  private readonly workLoop: WorkLoop;
  private _world: RAPIER.World | undefined;

  constructor(private readonly pixelsPerMeter: number) {
    this.workLoop = new WorkLoop(this.step.bind(this));

    (async () => {
      await RAPIER.init();
      this._world = new RAPIER.World({ x: 0.0, y: -9.81 });
    })();
  }

  get world() {
    return this._world;
  }

  setViewport(viewport: Vector): void {
    this.viewport = viewport;
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
    this.rootElement.on(
      ElementAddedEvent,
      event => {
        const pb = event.target;
        if (this._world && pb instanceof PhysicsBody) {
          pb.attachToSimulation(this);
        }
      },
      true
    );
  }

  start(maxFps: number): void {
    this.workLoop.start(maxFps);
  }

  getDebugInformation() {
    if (!this._world) {
      return [];
    }

    const lines: DebugLine[] = [];
    const { vertices, colors } = this._world.debugRender();

    for (let i = 0; i < vertices.length / 4; i += 1) {
      lines.push({
        from: this.simToVpCoords(
          new Vector(vertices[i * 4], vertices[i * 4 + 1])
        ),
        to: this.simToVpCoords(
          new Vector(vertices[i * 4 + 2], vertices[i * 4 + 3])
        ),
        color: `rgba(${Math.floor(colors[i * 8] * 255)}, ${Math.floor(colors[i * 8 + 1] * 255)}, ${Math.floor(colors[i * 8 + 2] * 255)}, ${colors[i * 8 + 3]})`,
      });
    }

    return lines;
  }

  private step(currentTime: number) {
    if (!this.rootElement || !this._world) {
      return;
    }

    this._world.step();

    this.rootElement.dispatchEvent(new PhysicsTickEvent(currentTime, this));
  }

  vpToSimDim(c: Vector): Vector {
    return c.div(this.pixelsPerMeter);
  }

  simToVpDim(c: Vector): Vector {
    return c.mul(this.pixelsPerMeter);
  }

  vpToSimCoords(c: Vector, d: Vector): Vector {
    const vh = this.viewport?.height || 0;
    const simD = this.vpToSimDim(d).div(2);

    let x = c.x / this.pixelsPerMeter;
    let y = (vh - (c.y + d.height)) / this.pixelsPerMeter;

    x += simD.width;
    y += simD.height;

    return new Vector(x, y);
  }

  simToVpCoords(c: Vector, d?: Vector): Vector {
    const vh = this.viewport?.height || 0;
    const vpC = this.simToVpDim(c);
    let x = vpC.x;
    let y = vpC.y;

    y = vh - y;

    if (d) {
      const simD = d.div(2);
      x -= simD.width;
      y -= simD.height;
    }

    x = Math.round(x);
    y = Math.round(y);

    return new Vector(x, y);
  }
}
