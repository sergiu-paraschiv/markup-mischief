import { EventEmitter } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import { AssetsLoader, AssetsMap, Texture } from '@engine/loaders';
import { MouseButton, MouseButtonAction, MouseInputEvent } from '@engine/input';
import { Sprite, SpriteMash } from '@engine/elements';
import TileSelectEvent from './TileSelectEvent';
import TileUnselectEvent from './TileUnselectEvent';
import GridStepChangeEvent from './GridStepChangeEvent';

export default class Editor extends Element {
  private engine: Engine | undefined;
  private sm: SpriteMash | undefined;
  private previousScene: Element | undefined;
  private selectedTile: Texture | undefined;
  private gridStep = new Vector(0, 0);

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    assetPaths: Record<string, string>,
    localToGlobalPoint: (point: Vector) => Vector
  ) {
    super();
    const guiEE = new EventEmitter();
    const assetsLoader = new AssetsLoader();

    const gui = document.createElement('mm-editor') as NgElement &
      WithProperties<{
        assets: AssetsMap;
        ee: EventEmitter<unknown>;
        canvasSize: Vector;
        canvasPosition: Vector;
        localToGlobalPoint: (point: Vector) => Vector;
      }>;

    gui.assets = assetsLoader.assets;
    gui.ee = guiEE;
    gui.localToGlobalPoint = localToGlobalPoint;

    guiEE.subscribe(event => {
      if (event instanceof TileSelectEvent) {
        this.selectedTile = assetsLoader.assets[event.asset].tilemaps[
          event.tileset
        ].get(event.tileId);
      } else if (event instanceof TileUnselectEvent) {
        this.selectedTile = undefined;
      } else if (event instanceof GridStepChangeEvent) {
        this.gridStep = event.step;
      }
    });

    this.on(MouseInputEvent, event => {
      if (
        event.action === MouseButtonAction.DOWN &&
        event.button === MouseButton.LEFT &&
        this.selectedTile &&
        this.sm
      ) {
        const x =
          Math.floor(event.point.x / this.gridStep.width) * this.gridStep.width;
        const y =
          Math.floor(event.point.y / this.gridStep.height) *
          this.gridStep.height;
        this.sm.addChild(new Sprite(this.selectedTile, new Vector(x, y)));
      }
    });

    (async () => {
      await assetsLoader.init(assetPaths);

      const canvasBox = canvas.getBoundingClientRect();
      gui.canvasPosition = new Vector(canvasBox.left, canvasBox.top);
      gui.canvasSize = new Vector(canvasBox.width, canvasBox.height);

      container.appendChild(gui);
    })();
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

    const sms = Query.childrenByType(SpriteMash, scene);
    if (sms.length !== 1) {
      throw new Error('Editor requires exactly one SpriteMash');
    }

    this.sm = sms[0];
  }
}
