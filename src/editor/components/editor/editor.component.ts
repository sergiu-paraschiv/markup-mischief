import { OnInit, Component, EventEmitter, Input } from '@angular/core';
import { Vector } from '@engine/core';
import { FormsModule } from '@angular/forms';
import { AssetsMap, TileMap } from '@engine/loaders';
import {
  TileSelectEvent,
  TileUnselectEvent,
  GridStepChangeEvent,
  SelectedToolChangeEvent,
  TexturePickEvent,
  SelectedLayerChangeEvent,
  DataChangeEvent,
  DataPasteEvent,
} from '@editor';
import { GridComponent } from '../grid/grid.component';
import { SpriteMashData } from '@engine/elements';

@Component({
  selector: 'editor',
  standalone: true,
  imports: [FormsModule, GridComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit {
  @Input() ee!: EventEmitter<unknown>;
  @Input() localToGlobalPoint!: (point: Vector) => Vector;
  @Input() numLayers = 1;
  @Input() assets: AssetsMap = {};
  @Input() canvasPosition = new Vector(0, 0);
  @Input() canvasSize = new Vector(0, 0);

  assetNames: string[] = [];
  selectedAsset:
    | {
        name: string;
        tilemaps: string[];
        animations: string[];
      }
    | undefined;

  selectedTilemap:
    | {
        name: string;
        tileIds: number[];
        tileWidth: number;
        tileHeight: number;
        tileImages: string[];
      }
    | undefined;

  selectedTileId: number | undefined;

  gridStep = new Vector(32, 32);
  localGridStep = new Vector(32, 32);

  selectedTool = 'paint';

  selectedLayer = 0;

  undoFn: (() => void) | undefined;
  redoFn: (() => void) | undefined;
  hasUndo = false;
  hasRedo = false;
  data = '';

  onGridStepXChange(x: number) {
    this.gridStep = new Vector(x, this.gridStep.y);
    this.handleGridStepChange();
  }

  onGridStepYChange(y: number) {
    this.gridStep = new Vector(this.gridStep.x, y);
    this.handleGridStepChange();
  }

  async ngOnInit(): Promise<void> {
    this.assetNames = Object.keys(this.assets);

    this.handleGridStepChange();
    this.handleSelectedToolChange();
    this.handleSelectedLayerChange();

    this.ee.subscribe(async event => {
      if (event instanceof TexturePickEvent) {
        if (event.texture) {
          for (const assetName of this.assetNames) {
            const asset = this.assets[assetName];
            for (const tilemapName of Object.keys(asset.tilemaps)) {
              const tilemap = asset.tilemaps[tilemapName];

              for (const [tileId, texture] of tilemap) {
                if (texture === event.texture) {
                  let forceReload = false;
                  if (this.selectedAsset?.name !== assetName) {
                    this.selectAsset(assetName);
                    forceReload = true;
                  }

                  if (
                    forceReload ||
                    this.selectedTilemap?.name !== tilemapName
                  ) {
                    await this.selectTilemap(tilemapName);
                    forceReload = true;
                  }

                  if (forceReload || this.selectedTileId !== tileId) {
                    this.selectTile(tileId);
                  }

                  return;
                }
              }
            }
          }
        }

        this.selectAsset(undefined);
      } else if (event instanceof DataChangeEvent) {
        this.undoFn = event.history.getUndo();
        this.hasUndo = !!this.undoFn;
        this.redoFn = event.history.getRedo();
        this.hasRedo = !!this.redoFn;
        this.data = JSON.stringify(event.history.getCurrentData());
      }
    });
  }

  onSelectAsset(event: MouseEvent, asset: string) {
    event.preventDefault();

    this.selectAsset(asset);
  }

  private selectAsset(asset: string | undefined) {
    this.selectedTilemap = undefined;
    this.selectedTileId = undefined;
    this.ee.emit(new TileUnselectEvent());

    if (asset) {
      this.selectedAsset = {
        name: asset,
        tilemaps: Object.keys(this.assets[asset].tilemaps),
        animations: Object.keys(this.assets[asset].animations),
      };
    }
  }

  async onSelectTilemap(event: MouseEvent, tilemap: string) {
    event.preventDefault();

    this.selectTilemap(tilemap);
  }

  private async selectTilemap(tilemap: string) {
    if (!this.selectedAsset) {
      throw new Error('No selected asset');
    }

    this.selectedTileId = undefined;
    this.ee.emit(new TileUnselectEvent());

    const tiles = this.assets[this.selectedAsset.name].tilemaps[tilemap];
    const tileIds = Array.from(tiles.keys());
    const tileImages: string[] = [];

    for (const tileId of tileIds) {
      const url = await this.getTileImgUrl(tiles, tileId);
      tileImages[tileId] = url;
    }

    const tileWidth = tiles.get(1)?.width || 0;
    const tileHeight = tiles.get(1)?.height || 0;

    this.selectedTilemap = {
      name: tilemap,
      tileIds,
      tileWidth,
      tileHeight,
      tileImages,
    };
  }

  onSelectAnimation(event: MouseEvent, animation: string) {
    event.preventDefault();

    this.selectedTilemap = undefined;
    this.selectedTileId = undefined;
    this.ee.emit(new TileUnselectEvent());

    console.log('animation', animation);
  }

  onSelectTile(event: MouseEvent, tileId: number) {
    event.preventDefault();

    this.selectTile(tileId);
  }

  private selectTile(tileId: number) {
    if (!this.selectedAsset) {
      throw new Error('No selected asset');
    }

    if (!this.selectedTilemap) {
      throw new Error('No selected tileset');
    }

    this.selectedTileId = tileId;

    this.ee.emit(
      new TileSelectEvent(
        this.selectedAsset.name,
        this.selectedTilemap.name,
        tileId
      )
    );
  }

  onUseTilemapGrid(event: MouseEvent) {
    event.preventDefault();

    if (!this.selectedAsset) {
      throw new Error('No selected asset');
    }

    if (!this.selectedTilemap) {
      throw new Error('No selected tileset');
    }

    this.gridStep = new Vector(
      this.selectedTilemap.tileWidth,
      this.selectedTilemap.tileHeight
    );
    this.handleGridStepChange();
  }

  onSelectTool(event: MouseEvent, tool: string) {
    event.preventDefault();

    this.selectedTool = tool;
    this.handleSelectedToolChange();
  }

  onSelectLayer(event: MouseEvent, layer: number) {
    event.preventDefault();

    this.selectedLayer = layer;
    this.handleSelectedLayerChange();
  }

  onUndo(event: MouseEvent) {
    event.preventDefault();

    if (this.hasUndo && this.undoFn) {
      this.undoFn();
    }
  }

  onRedo(event: MouseEvent) {
    event.preventDefault();

    if (this.hasRedo && this.redoFn) {
      this.redoFn();
    }
  }

  private async getTileImgUrl(
    tilemap: TileMap,
    tileId: number
  ): Promise<string> {
    const tile = tilemap.get(tileId);

    if (!tile) {
      throw new Error(`Tile with ID ${tileId} does not exist`);
    }

    const canvas = new OffscreenCanvas(tile.width, tile.height);
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(tile.data, 0, 0);

      let blob: Blob | undefined;

      if (canvas.convertToBlob) {
        blob = await canvas.convertToBlob();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((canvas as any).toBlob) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blob = await (canvas as any).toBlob();
      }

      if (blob) {
        return window.URL.createObjectURL(blob);
      }
    }

    return '';
  }

  private handleGridStepChange() {
    this.ee.emit(new GridStepChangeEvent(this.gridStep));
    this.localGridStep = this.localToGlobalPoint(this.gridStep);
  }

  private handleSelectedToolChange() {
    this.ee.emit(new SelectedToolChangeEvent(this.selectedTool));
  }

  private handleSelectedLayerChange() {
    this.ee.emit(new SelectedLayerChangeEvent(this.selectedLayer));
  }

  onSelectData() {
    navigator.clipboard.writeText(this.data);
  }

  onDataChange(rawData: string) {
    this.data = rawData;
    const data = JSON.parse(rawData);
    if (data) {
      this.ee.emit(new DataPasteEvent(data as SpriteMashData));
    }
  }

  getLayers() {
    const layers = [];
    for (let i = 0; i < this.numLayers; i += 1) {
      layers.push(i);
    }
    return layers;
  }
}
