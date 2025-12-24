import { EventEmitter } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { Engine, SceneLoadedEvent } from '@engine';
import { Element, Query, Vector } from '@engine/core';
import {
  AsepriteTextureMeta,
  AsepriteAnimationMeta,
  AssetsLoader,
  AssetsMap,
  Texture,
} from '@engine/loaders';
import {
  MouseButton,
  MouseButtonAction,
  MouseInputEvent,
  MouseMoveEvent,
} from '@engine/input';
import {
  Node2D,
  Sprite,
  AnimatedSprite,
  SpriteMash,
  SpriteMashData,
  SpriteMashItemType,
  Animation,
} from '@engine/elements';
import TileSelectEvent from './TileSelectEvent';
import TileUnselectEvent from './TileUnselectEvent';
import AnimationSelectEvent from './AnimationSelectEvent';
import GridStepChangeEvent from './GridStepChangeEvent';
import SelectedToolChangeEvent from './SelectedToolChangeEvent';
import TexturePickEvent from './TexturePickEvent';
import AnimationPickEvent from './AnimationPickEvent';
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
  private selectedAnimation: Animation | undefined;
  private selectedAnimationMeta: AsepriteAnimationMeta | undefined;
  private selectedTool: string | undefined;
  private selectedLayer = 0;
  private gridStep = new Vector(0, 0);
  private history: History<SpriteMashData> | undefined;
  private ghostSprite: Sprite | AnimatedSprite | undefined;
  private lastMousePosition: Vector | undefined;

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
        this.updateGhostSprite();
      } else if (event instanceof AnimationSelectEvent) {
        this.selectedAnimation =
          this.assetsLoader?.assets[event.asset].animations[
            event.animationName
          ];
        this.selectedAnimationMeta = new AsepriteAnimationMeta(
          event.asset,
          event.animationName
        );
        this.updateGhostSprite();
      } else if (event instanceof TileUnselectEvent) {
        this.selectedTile = undefined;
        this.selectedTileMeta = undefined;
        this.selectedAnimation = undefined;
        this.selectedAnimationMeta = undefined;
        this.updateGhostSprite();
      } else if (event instanceof GridStepChangeEvent) {
        this.gridStep = event.step;
        this.updateGhostSprite();
      } else if (event instanceof SelectedToolChangeEvent) {
        this.selectedTool = event.tool;
        this.updateGhostSprite();
      } else if (event instanceof SelectedLayerChangeEvent) {
        this.selectedLayer = event.layer;
      } else if (event instanceof DataPasteEvent) {
        this.loadData(event.data);
        this.handleChange();
      }
    });

    this.on(MouseMoveEvent, event => {
      // Update ghost sprite position on mouse move
      this.lastMousePosition = event.point;
      this.updateGhostSprite();
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

        if (this.selectedTool === 'paint') {
          if (
            tileUnderPointer &&
            (tileUnderPointer instanceof Sprite ||
              tileUnderPointer instanceof AnimatedSprite)
          ) {
            tileUnderPointer.remove();
          }
        } else if (this.selectedTool === 'erase') {
          // First try the selected layer
          let tileResult = tileUnderPointer
            ? { tile: tileUnderPointer, layerIndex: this.selectedLayer }
            : undefined;

          // If nothing found on selected layer, search all layers
          if (!tileResult) {
            tileResult = this.getTileAtAnyLayer(event.point);
          }

          if (tileResult) {
            // Switch to the layer where the tile was found
            if (tileResult.layerIndex !== this.selectedLayer) {
              this.gui?.ee.emit(
                new SelectedLayerChangeEvent(tileResult.layerIndex)
              );
            }

            // Remove the tile
            tileResult.tile.remove();
            this.handleChange();
          }
        } else if (this.selectedTool === 'pick') {
          // First try the selected layer
          let tileResult = tileUnderPointer
            ? { tile: tileUnderPointer, layerIndex: this.selectedLayer }
            : undefined;

          // If nothing found on selected layer, search all layers
          if (!tileResult) {
            tileResult = this.getTileAtAnyLayer(event.point);
          }

          if (tileResult) {
            // Switch to the layer where the tile was found
            if (tileResult.layerIndex !== this.selectedLayer) {
              this.gui?.ee.emit(
                new SelectedLayerChangeEvent(tileResult.layerIndex)
              );
            }

            const tile = tileResult.tile;
            if (tile instanceof AnimatedSprite) {
              this.gui?.ee.emit(new AnimationPickEvent(tile.animation));
            } else if (tile instanceof Sprite) {
              this.gui?.ee.emit(new TexturePickEvent(tile.texture));
            }
          } else {
            this.gui?.ee.emit(new TexturePickEvent(undefined));
            this.gui?.ee.emit(new AnimationPickEvent(undefined));
          }
        }

        if (this.selectedTool === 'paint') {
          if (this.selectedTile && this.selectedTileMeta) {
            const sprite = new Sprite(
              this.selectedTile,
              this.getGridPoint(event.point)
            );
            sprite.withMeta(this.selectedTileMeta);
            layer.addChild(sprite);

            this.handleChange();
          } else if (this.selectedAnimation && this.selectedAnimationMeta) {
            const animatedSprite = new AnimatedSprite(
              this.selectedAnimation,
              this.getGridPoint(event.point)
            );
            animatedSprite.withMeta(this.selectedAnimationMeta);
            layer.addChild(animatedSprite);

            this.handleChange();
          }
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
        if (item.type === SpriteMashItemType.Animated) {
          const animation =
            this.assetsLoader?.assets[item.animation.asset].animations[
              item.animation.animationName
            ];
          if (animation) {
            const animatedSprite = new AnimatedSprite(
              animation,
              new Vector(item.position.x, item.position.y)
            );
            animatedSprite.withMeta(
              new AsepriteAnimationMeta(
                item.animation.asset,
                item.animation.animationName
              )
            );
            this.getLayer(layerIndex)?.addChild(animatedSprite);
          }
        } else if (item.type === SpriteMashItemType.Static) {
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

  private getTileAtAnyLayer(
    point: Vector
  ): { tile: Node2D; layerIndex: number } | undefined {
    if (!this.sm) {
      return undefined;
    }

    // Search from top layer to bottom layer
    for (
      let layerIndex = this.sm.numLayers - 1;
      layerIndex >= 0;
      layerIndex--
    ) {
      const layer = this.getLayer(layerIndex);
      if (!layer) {
        continue;
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
          return { tile: element, layerIndex };
        }
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

  private updateGhostSprite() {
    // Remove existing ghost if any
    if (this.ghostSprite) {
      this.ghostSprite.remove();
      this.ghostSprite = undefined;
    }

    // Only show ghost when paint tool is selected and something is selected
    if (this.selectedTool !== 'paint') {
      return;
    }

    if (!this.lastMousePosition) {
      return;
    }

    const gridPosition = this.getGridPoint(this.lastMousePosition);

    // Create ghost sprite for static tile
    if (this.selectedTile) {
      this.ghostSprite = new Sprite(this.selectedTile, gridPosition);
      this.addChild(this.ghostSprite, 900);
    }
    // Create ghost sprite for animation
    else if (this.selectedAnimation) {
      this.ghostSprite = new AnimatedSprite(
        this.selectedAnimation,
        gridPosition
      );
      this.addChild(this.ghostSprite);
    }
  }
}
