import { EventEmitter } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import {
  AsepriteTextureMeta,
  AssetsLoader,
  AssetsMap,
  Texture,
} from '@engine/loaders';
import { MouseButton, MouseButtonAction, MouseInputEvent } from '@engine/input';
import { Node2D, Sprite, SpriteMash, SpriteMashData } from '@engine/elements';
import TileSelectEvent from './TileSelectEvent';
import TileUnselectEvent from './TileUnselectEvent';
import GridStepChangeEvent from './GridStepChangeEvent';
import SelectedToolChangeEvent from './SelectedToolChangeEvent';
import TexturePickEvent from './TexturePickEvent';
import SelectedLayerChangeEvent from './SelectedLayerChangeEvent';
import DataChangeEvent from './DataChangeEvent';
import History from './History';
import DataPasteEvent from './DataPasteEvent';

type GUI = NgElement &
  WithProperties<{
    assets: AssetsMap;
    ee: EventEmitter<unknown>;
    numLayers: number;
    canvasSize: Vector;
    canvasPosition: Vector;
    localToGlobalPoint: (point: Vector) => Vector;
  }>;

export default class Editor extends Element {
  private engine: Engine | undefined;
  private assetsLoader: AssetsLoader | undefined;
  private gui: GUI | undefined;
  private sm: SpriteMash | undefined;
  private previousData: string | undefined;
  private previousScene: Element | undefined;
  private selectedTile: Texture | undefined;
  private selectedTileMeta: AsepriteTextureMeta | undefined;
  private selectedTool: string | undefined;
  private selectedLayer = 0;
  private gridStep = new Vector(0, 0);
  private history: History<SpriteMashData> | undefined;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    assetPaths: Record<string, string>,
    localToGlobalPoint: (point: Vector) => Vector
  ) {
    super();
    this.assetsLoader = new AssetsLoader();

    this.gui = document.createElement('mm-editor') as GUI;

    this.gui.assets = this.assetsLoader.assets;
    this.gui.ee = new EventEmitter();
    this.gui.localToGlobalPoint = localToGlobalPoint;

    this.gui.ee.subscribe(event => {
      if (event instanceof TileSelectEvent) {
        this.selectedTile = this.assetsLoader?.assets[event.asset].tilemaps[
          event.tileset
        ].get(event.tileId);
        this.selectedTileMeta = new AsepriteTextureMeta(
          event.asset,
          event.tileset,
          event.tileId
        );
      } else if (event instanceof TileUnselectEvent) {
        this.selectedTile = undefined;
        this.selectedTileMeta = undefined;
      } else if (event instanceof GridStepChangeEvent) {
        this.gridStep = event.step;
      } else if (event instanceof SelectedToolChangeEvent) {
        this.selectedTool = event.tool;
      } else if (event instanceof SelectedLayerChangeEvent) {
        this.selectedLayer = event.layer;
      } else if (event instanceof DataPasteEvent) {
        this.loadData(event.data);
        this.handleChange();
      }
    });

    this.on(MouseInputEvent, event => {
      const layer = this.getSelectedLayer();
      if (!layer) {
        return;
      }

      if (
        event.action === MouseButtonAction.DOWN &&
        event.button === MouseButton.LEFT
      ) {
        const tileUnderPointer = this.getTileAt(event.point);

        if (this.selectedTool === 'paint' || this.selectedTool === 'erase') {
          if (tileUnderPointer && tileUnderPointer instanceof Sprite) {
            tileUnderPointer.remove();

            if (this.selectedTool === 'erase') {
              this.handleChange();
            }
          }
        } else if (this.selectedTool === 'pick') {
          if (tileUnderPointer && tileUnderPointer instanceof Sprite) {
            this.gui?.ee.emit(new TexturePickEvent(tileUnderPointer.texture));
          } else {
            this.gui?.ee.emit(new TexturePickEvent(undefined));
          }
        }

        if (this.selectedTool === 'paint' && this.selectedTile) {
          const sprite = new Sprite(
            this.selectedTile,
            this.getGridPoint(event.point)
          );
          sprite.withMeta(this.selectedTileMeta);
          layer.addChild(sprite);

          this.handleChange();
        }
      }
    });

    (async () => {
      if (!this.gui) {
        return;
      }

      await this.assetsLoader?.init(assetPaths);

      const canvasBox = canvas.getBoundingClientRect();
      this.gui.canvasPosition = new Vector(canvasBox.left, canvasBox.top);
      this.gui.canvasSize = new Vector(canvasBox.width, canvasBox.height);

      container.appendChild(this.gui);
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
    if (this.gui) {
      this.gui.numLayers = this.sm.numLayers;
    }

    this.history = new History(this.sm.toObject(), data => {
      this.loadData(data);
    });
  }

  private loadData(data: SpriteMashData) {
    if (!this.sm) {
      return;
    }

    this.sm.clear(data.numLayers || 1);
    if (this.gui) {
      this.gui.numLayers = this.sm.numLayers;
    }

    for (let layerIndex = 0; layerIndex < data.layers.length; layerIndex += 1) {
      const items = data.layers[layerIndex];
      for (const item of items) {
        const tile = this.assetsLoader?.assets[item.texture.asset].tilemaps[
          item.texture.tileset
        ].get(item.texture.tileId);
        const sprite = new Sprite(
          tile,
          new Vector(item.position.x, item.position.y)
        );
        sprite.withMeta(
          new AsepriteTextureMeta(
            item.texture.asset,
            item.texture.tileset,
            item.texture.tileId
          )
        );
        this.getLayer(layerIndex)?.addChild(sprite);
      }
    }

    if (this.history) {
      this.gui?.ee.emit(new DataChangeEvent(this.history));
    }
  }

  private getTileAt(point: Vector): Node2D | undefined {
    const layer = this.getSelectedLayer();
    if (!layer) {
      return;
    }

    const elements = Query.childrenByType(Node2D, layer);
    for (const element of elements) {
      const left = element.position.left;
      const right = element.position.left + element.width;
      const top = element.position.top;
      const bottom = element.position.top + element.height;

      if (
        left <= point.x &&
        point.x <= right &&
        top <= point.y &&
        point.y <= bottom
      ) {
        return element;
      }
    }
    return undefined;
  }

  private getGridPoint(point: Vector): Vector {
    const x = Math.floor(point.x / this.gridStep.width) * this.gridStep.width;
    const y = Math.floor(point.y / this.gridStep.height) * this.gridStep.height;

    return new Vector(x, y);
  }

  private getSelectedLayer() {
    return this.getLayer(this.selectedLayer);
  }

  private getLayer(index: number) {
    return this.sm?.getLayer(index);
  }

  private handleChange() {
    if (!this.sm || !this.history) {
      return;
    }

    const rawData = this.sm.toObject();
    const data = JSON.stringify(rawData);

    if (this.previousData === data) {
      return;
    }

    this.previousData = data;
    this.history.add(rawData);
    this.gui?.ee.emit(new DataChangeEvent(this.history));
  }
}
