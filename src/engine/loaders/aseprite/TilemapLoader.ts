import { inflate } from 'pako';
import Texture from '../Texture';
import AsepriteCache from './AsepriteCache';
import AsepriteLoader from './AsepriteLoader';
import {
  TilesetChunk,
  TILESET_CHUNK,
  LAYER_CHUNK,
  LayerChunk,
} from './AsepriteParser';
import ColorPalletteLoader from './ColorPalletteLoader';

export type TileMap = Map<number, Texture>;

export default class TilemapLoader {
  private static tilemapCache = new AsepriteCache<TileMap>();
  private collorPalletteLoader: ColorPalletteLoader;

  constructor(private loader: AsepriteLoader) {
    this.collorPalletteLoader = new ColorPalletteLoader(loader);
  }

  getTilemapNames(frameIndex = 0): string[] {
    if (!this.loader.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const layers = this.loader.findFrameChunks<LayerChunk>(
      frameIndex,
      LAYER_CHUNK
    );

    return layers
      .filter(layer => {
        if (!layer.tilesetIndex || layer.tilesetIndex.length !== 1) {
          return false;
        }
        return true;
      })
      .map(layer => layer.name.value);
  }

  async getTilemap(tilemapName: string, frameIndex = 0): Promise<TileMap> {
    return TilemapLoader.tilemapCache.get(
      `${tilemapName}-${frameIndex}`,
      async () => {
        if (!this.loader.data) {
          throw new Error('Aseprite file not loaded!');
        }

        const tilesetChunks = this.loader.findFrameChunks<TilesetChunk>(
          frameIndex,
          TILESET_CHUNK
        );
        const layers = this.loader.findFrameChunks<LayerChunk>(
          frameIndex,
          LAYER_CHUNK
        );
        const tilemapLayer = layers.find(
          layer => layer.name.value === tilemapName
        );
        if (!tilemapLayer) {
          throw new Error(`Tilemap Layer with name ${tilemapName} not found!`);
        }
        if (
          !tilemapLayer.tilesetIndex ||
          tilemapLayer.tilesetIndex.length !== 1
        ) {
          throw new Error(`Layer with name ${tilemapName} is not a Tilemap!`);
        }

        const tilesetChunk = tilesetChunks[tilemapLayer.tilesetIndex[0]];
        const colorPallette =
          this.collorPalletteLoader.getColorPallette(frameIndex);

        const decompressedData = inflate(
          new Uint8Array(tilesetChunk.rawCompressed)
        );
        const rgbaData = colorPallette.rawDataToRGBA(
          decompressedData,
          this.loader.data.header.colorDepth,
          this.loader.data.header.transparentIndex
        );

        const NUM_BYTES_IN_TILE =
          tilesetChunk.tileWidth * tilesetChunk.tileHeight * 4;

        const tilemap = new Map<number, Texture>();
        for (
          let tileIndex = 0;
          tileIndex < tilesetChunk.numberOfTiles;
          tileIndex += 1
        ) {
          const tileId = tilesetChunk.baseIndex + tileIndex - 1;
          const tileData = rgbaData.slice(
            tileIndex * NUM_BYTES_IN_TILE,
            (tileIndex + 1) * NUM_BYTES_IN_TILE
          );

          const imageData = new ImageData(
            new Uint8ClampedArray(tileData),
            tilesetChunk.tileWidth,
            tilesetChunk.tileHeight
          );
          const imageBitmap = await createImageBitmap(imageData);
          tilemap.set(tileId, Texture.fromImageBitmap(imageBitmap));
        }

        return tilemap;
      }
    );
  }
}
