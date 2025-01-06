import { OnInit, Component, EventEmitter, Input } from '@angular/core';
import { Vector } from '@engine/core';
import { FormsModule } from '@angular/forms';
import { AssetsMap, TileMap } from '@engine/loaders';
import {
  TileSelectEvent,
  TileUnselectEvent,
  GridStepChangeEvent,
} from '@editor';
import { GridComponent } from '../grid/grid.component';

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
  }

  onSelectAsset(event: MouseEvent, asset: string) {
    event.preventDefault();

    this.selectedTilemap = undefined;
    this.selectedTileId = undefined;
    this.ee.emit(new TileUnselectEvent());

    this.selectedAsset = {
      name: asset,
      tilemaps: Object.keys(this.assets[asset].tilemaps),
      animations: Object.keys(this.assets[asset].animations),
    };
  }

  async onSelectTilemap(event: MouseEvent, tilemap: string) {
    event.preventDefault();

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
}
