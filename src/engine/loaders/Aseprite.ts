import { Parser } from 'binary-parser';
import { inflate } from 'pako';
import { Animation, Frame } from '../elements/AnimatedSprite';
import Texture from './Texture';

const ignoreChunkDataParser = new Parser().endianness('little').array('data', {
  type: 'uint8',
  lengthInBytes: function () {
    return (this as any).$parent.size - 6;
  },
});

const rgbParser = new Parser()
  .endianness('little')
  .uint8('red')
  .uint8('green')
  .uint8('blue');

const rgbaParser = new Parser()
  .endianness('little')
  .uint8('red')
  .uint8('green')
  .uint8('blue')
  .uint8('alpha');

const stringParser = new Parser()
  .endianness('little')
  .uint16('length')
  .string('value', {
    length: 'length',
  });

const oldPalletteChunkParser = new Parser()
  .endianness('little')
  .uint16('numberOfPackets')
  .array('packets', {
    type: new Parser()
      .endianness('little')
      .uint8('entriesToSkip')
      .uint8('numberOfColors')
      .array('colors', {
        type: rgbParser,
        length: function () {
          return (this as any).numberOfColors || 256;
        },
      }),
    length: 'numberOfPackets',
  });

const palletteChunkParser = new Parser()
  .endianness('little')
  .uint32('size')
  .uint32('firstIndex')
  .uint32('lastIndex')
  .seek(8)
  .array('colors', {
    type: new Parser()
      .endianness('little')
      .uint16('flags')
      .nest('color', {
        type: rgbaParser,
      })
      .array('name', {
        type: stringParser,
        length: function () {
          if ((this as any).flags === 1) {
            return 1;
          }
          return 0;
        },
      }),
    length: function () {
      return (this as any).lastIndex - (this as any).firstIndex + 1;
    },
  });
type PalletteV3Chunk = ReturnType<typeof palletteChunkParser.parse>;

const layerChunkParser = new Parser()
  .endianness('little')
  .uint16('flags')
  .uint16('type')
  .uint16('childLevel')
  .uint16('ignored')
  .uint16('ignored')
  .uint16('blendMode')
  .uint8('opacity')
  .seek(3)
  .nest('name', {
    type: stringParser,
  })
  .array('tilesetIndex', {
    type: 'uint32le',
    length: function () {
      if ((this as any).type === 2) {
        return 1;
      }
      return 0;
    },
  });
type LayerChunk = ReturnType<typeof layerChunkParser.parse>;

const celChunkLinkedFrameParser = new Parser()
  .endianness('little')
  .uint16('linkedFrame');
type CelChunkLinkedFrame = ReturnType<typeof celChunkLinkedFrameParser.parse>;

const celChunkCompressedImageParser = new Parser()
  .endianness('little')
  .uint16('w')
  .uint16('h')
  .array('rawCompressed', {
    type: 'uint8',
    length: function () {
      return (this as any).$parent.$parent.size - 26;
    },
  });
type CelChunkCompressedImage = ReturnType<
  typeof celChunkCompressedImageParser.parse
>;

const celChunkCompressedTilemapParser = new Parser()
  .endianness('little')
  .uint16('w')
  .uint16('h')
  .uint16('bitsPerTile')
  .uint32('tileIdBitmask')
  .uint32('xFlipBitmask')
  .uint32('yFlipBitmask')
  .uint32('diagonalFlipBitmask')
  .seek(10)
  .array('rawCompressed', {
    type: 'uint8',
    length: function () {
      return (this as any).$parent.$parent.size - 54;
    },
  });

const LINKED_FRAME_CEL_TYPE = 1;
const COMPRESSED_IMAGE_CEL_TYPE = 2;
const COMPRESSED_TILEMAP_CEL_TYPE = 3;

const celChunkParser = new Parser()
  .endianness('little')
  .uint16('layerIndex')
  .int16('x')
  .int16('y')
  .uint8('opacity')
  .uint16('cellType')
  .int16('zIndex')
  .seek(5)
  .choice('data', {
    tag: 'cellType',
    choices: {
      // Raw Image Data
      // 0: -> UNUSED

      // Linked Frame
      [LINKED_FRAME_CEL_TYPE]: celChunkLinkedFrameParser,

      // Compressed Image
      [COMPRESSED_IMAGE_CEL_TYPE]: celChunkCompressedImageParser,

      // Compressed Tilemap
      [COMPRESSED_TILEMAP_CEL_TYPE]: celChunkCompressedTilemapParser,
    },
  });

type CelChunk = ReturnType<typeof celChunkParser.parse>;

const tagParser = new Parser()
  .endianness('little')
  .uint16('fromFrame')
  .uint16('toFrame')
  .uint8('loopAnimationDirection')
  .uint16('repeatAnimation')
  .seek(10)
  .nest('tagName', {
    type: stringParser,
  });

const tagsChunkParser = new Parser()
  .endianness('little')
  .uint16('numberOfTags')
  .seek(8)
  .array('tags', {
    type: tagParser,
    length: 'numberOfTags',
  });
type TagsChunk = ReturnType<typeof tagsChunkParser.parse>;

const tilesetChunkParser = new Parser()
  .endianness('little')
  .uint32('tilesetId')
  .uint32('tilesetFlags')
  .uint32('numberOfTiles')
  .uint16('tileWidth')
  .uint16('tileHeight')
  .int16('baseIndex')
  .seek(14)
  .nest('name', {
    type: stringParser,
  })
  .array('external', {
    type: 'uint32le',
    length: function () {
      if ((this as any).tilesetFlags & 1) {
        return 2;
      }
      return 0;
    },
  })
  .array('internalLength', {
    type: 'uint32le',
    length: function () {
      if ((this as any).tilesetFlags & 2) {
        return 1;
      }
      return 0;
    },
  })
  .array('rawCompressed', {
    type: 'uint8',
    length: function () {
      if ((this as any).tilesetFlags & 2) {
        return (this as any).internalLength[0];
      }
      return 0;
    },
  });
type TilesetChunk = ReturnType<typeof tilesetChunkParser.parse>;

const headerParser = new Parser()
  .endianness('little')
  .uint32('fileSize')
  .uint16('magicNumber')
  .uint16('frames')
  .uint16('width')
  .uint16('height')
  .uint16('colorDepth')
  .uint32('flags')
  .uint16('DEPRECATED_speed')
  .seek(8)
  .uint8('transparentIndex')
  .seek(3)
  .uint16('numberOfColors')
  .uint8('pixelWidth')
  .uint8('pixelHeight')
  .int16('gridX')
  .int16('gridY')
  .uint16('gridWidth')
  .uint16('gridHeight')
  .seek(84);

const frameHeaderParser = new Parser()
  .endianness('little')
  .uint32('bytesInFrame')
  .uint16('magicNumber')
  .uint16('oldChunks')
  .uint16('frameDuration')
  .seek(2)
  .uint32('chunks');

const LAYER_CHUNK = 0x2004;
const CEL_CHUNK = 0x2005;
const TAGS_CHUNK = 0x2018;
const PALLETTE_CHUNK_V1 = 0x0004;
const PALLETTE_CHUNK_V2 = 0x0011;
const PALLETTE_CHUNK_V3 = 0x2019;
const TILESET_CHUNK = 0x2023;

const frameChunkParser = new Parser()
  .endianness('little')
  .uint32('size')
  .uint16('chunkType')
  .choice('data', {
    tag: 'chunkType',
    choices: {
      [PALLETTE_CHUNK_V1]: oldPalletteChunkParser,
      [PALLETTE_CHUNK_V2]: oldPalletteChunkParser,
      [LAYER_CHUNK]: layerChunkParser,
      [CEL_CHUNK]: celChunkParser,
      [TAGS_CHUNK]: tagsChunkParser,
      [PALLETTE_CHUNK_V3]: palletteChunkParser,
      [TILESET_CHUNK]: tilesetChunkParser,
    },
    defaultChoice: ignoreChunkDataParser,
  });

const frameParser = new Parser()
  .endianness('little')
  .nest('header', {
    type: frameHeaderParser,
  })
  .array('chunks', {
    type: frameChunkParser,
    length: function () {
      return (this as any).header.chunks || (this as any).header.oldChunks;
    },
  });

const mainParser = (
  new Parser() as Parser & {
    useContextVars: () => Parser;
  }
)
  .useContextVars()
  .endianness('little')
  .nest('header', {
    type: headerParser,
  })
  .array('frames', {
    type: frameParser,
    length: 'header.frames',
  });

function rawDataToRGBA(
  data: Uint8Array,
  colorDepth: number,
  transparentIndex: number,
  colorPallette: ColorPallette
): Uint8Array {
  if (colorDepth === 16) {
    const numPixels = (data.byteLength / 2) * 4;
    const resultPixels = new Uint8Array(numPixels);
    for (let i = 0; i < numPixels; i += 4) {
      const source = Math.floor(i / 4) * 2;
      resultPixels[i + 0] = data[source + 0];
      resultPixels[i + 1] = data[source + 0];
      resultPixels[i + 2] = data[source + 0];
      resultPixels[i + 3] = data[source + 1];
    }
    return resultPixels;
  } else if (colorDepth === 8) {
    const numPixels = data.byteLength * 4;
    const resultPixels = new Uint8Array(numPixels);
    for (let i = 0; i < numPixels; i += 4) {
      const source = Math.floor(i / 4);
      let color = [255, 255, 255, 0];
      if (data[source] !== transparentIndex) {
        color = colorPallette.get(data[source]) ?? [255, 255, 255, 0];
      }
      resultPixels[i + 0] = color[0];
      resultPixels[i + 1] = color[1];
      resultPixels[i + 2] = color[2];
      resultPixels[i + 3] = Math.ceil(color[3] * 255);
    }
    return resultPixels;
  }
  return data;
}

type ColorPallette = Map<number, [number, number, number, number]>;
type TileMap = Map<number, Texture>;

export default class Aseprite {
  public data: ReturnType<typeof mainParser.parse> | undefined;
  private ignoredLayerNames: string[] = [];

  static async load(src: string): Promise<Aseprite> {
    const aseprite = new Aseprite();

    const response = await fetch(src);
    const buffer = await response.arrayBuffer();
    aseprite.data = mainParser.parse(new Uint8Array(buffer) as any);

    if (aseprite.data.header.magicNumber !== 0xa5e0) {
      throw Error('Invalid Aseprite file header magic number!');
    }

    return aseprite;
  }

  ignoreLayers(names: string[]) {
    this.ignoredLayerNames = names;
  }

  async getAnimation(animationName: string): Promise<Animation> {
    const tagsChunk = this.findFrameChunk<TagsChunk>(0, TAGS_CHUNK);
    if (!tagsChunk) {
      throw Error('Aseprite file has no tags!');
    }

    const animationTag = tagsChunk.tags.find(
      (tag) => tag.tagName.value === animationName
    );
    if (!animationTag) {
      throw Error(`Animation with name ${animationName} not found !`);
    }

    return {
      frames: await this.getFrames(
        animationTag.fromFrame,
        animationTag.toFrame
      ),
      direction: animationTag.loopAnimationDirection,
      repeat:
        animationTag.repeatAnimation <= 2 ? animationTag.repeatAnimation : 3,
      repeatTimes:
        animationTag.repeatAnimation <= 2 ? 0 : animationTag.repeatAnimation,
    };
  }

  async getFrames(startIndex: number, endIndex: number): Promise<Frame[]> {
    const frames: Frame[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      frames.push(await this.getFrame(i));
    }

    return frames;
  }

  async getFrame(frameIndex: number): Promise<Frame> {
    if (!this.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const frameData = this.data.frames[frameIndex];

    const context = this.getDrawContext();
    const colorPallette = this.getColorPallette(0);

    const layers = this.findFrameChunks<LayerChunk>(0, LAYER_CHUNK);
    const celChunks = this.findFrameChunks<CelChunk>(frameIndex, CEL_CHUNK);

    for (const celChunk of celChunks) {
      if (celChunk.cellType === LINKED_FRAME_CEL_TYPE) {
        const linkedFrame = await this.getFrame(
          (celChunk.data as unknown as CelChunkLinkedFrame).linkedFrame
        );
        const layer = layers[celChunk.layerIndex];
        if (
          (layer.flags & 0x1) === 1 &&
          !this.ignoredLayerNames.includes(layer.name.value)
        ) {
          context.save();
          context.drawImage(linkedFrame.texture.data, 0, 0);
          context.restore();
        }
      } else if (celChunk.cellType === COMPRESSED_IMAGE_CEL_TYPE) {
        const layer = layers[celChunk.layerIndex];
        if (
          (layer.flags & 0x1) === 1 &&
          !this.ignoredLayerNames.includes(layer.name.value)
        ) {
          const compressedImageCelChunk =
            celChunk.data as unknown as CelChunkCompressedImage;
          const compressedData = compressedImageCelChunk.rawCompressed;
          const decompressedData = inflate(new Uint8Array(compressedData));
          const rgbaData = rawDataToRGBA(
            decompressedData,
            this.data.header.colorDepth,
            this.data.header.transparentIndex,
            colorPallette
          );
          const imageData = new ImageData(
            new Uint8ClampedArray(rgbaData),
            compressedImageCelChunk.w,
            compressedImageCelChunk.h
          );
          const imageBitmap = await createImageBitmap(imageData);

          context.save();
          context.globalAlpha =
            ((celChunk.opacity / 255) * (layer?.opacity ?? 255)) / 255;
          context.drawImage(imageBitmap, celChunk.x, celChunk.y);
          context.restore();
        }
      }
    }

    const imageData = context.getImageData(
      0,
      0,
      this.data.header.width,
      this.data.header.height
    );
    const imageBitmap = await createImageBitmap(imageData);

    return {
      texture: Texture.fromImageBitmap(imageBitmap),
      duration: frameData.header.frameDuration,
    };
  }

  async getTilemap(
    tilemapName: string,
    frameIndex = 0
  ): Promise<TileMap> {
    if (!this.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const tilesetChunks = this.findFrameChunks<TilesetChunk>(
      frameIndex,
      TILESET_CHUNK
    );
    const layers = this.findFrameChunks<LayerChunk>(frameIndex, LAYER_CHUNK);
    const tilemapLayer = layers.find(
      (layer) => layer.name.value === tilemapName
    );
    if (!tilemapLayer) {
      throw new Error(`Tilemap Layer with name ${tilemapName} not found!`);
    }
    if (!tilemapLayer.tilesetIndex || tilemapLayer.tilesetIndex.length !== 1) {
      throw new Error(`Layer with name ${tilemapName} is not a Tilemap!`);
    }

    const tilesetChunk = tilesetChunks[tilemapLayer.tilesetIndex[0]];
    const colorPallette = this.getColorPallette(frameIndex);

    const decompressedData = inflate(
      new Uint8Array(tilesetChunk.rawCompressed)
    );
    const rgbaData = rawDataToRGBA(
      decompressedData,
      this.data.header.colorDepth,
      this.data.header.transparentIndex,
      colorPallette
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

  private findFrameChunks<T>(frameIndex: number, ofType: number): T[] {
    if (!this.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const frameData = this.data.frames[frameIndex];

    const chunks = frameData.chunks.filter(
      (chunk) => chunk.chunkType === ofType
    ) as unknown[];

    return chunks.map((chunk) => (chunk as any).data) as T[];
  }

  private findFrameChunk<T>(frameIndex: number, ofType: number): T | undefined {
    const chunks = this.findFrameChunks<T>(frameIndex, ofType);
    if (chunks.length === 1) {
      return chunks[0];
    } else if (chunks.length === 0) {
      return undefined;
    }

    throw new Error(`Multiple Chunks of type ${ofType} found!`);
  }

  private getDrawContext() {
    const canvas = new OffscreenCanvas(
      this.data?.header.width || 0,
      this.data?.header.height || 0
    );
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error(
        'Could not obtain OffscreenCanvas 2D Context for processing Aseprite!'
      );
    }

    context.imageSmoothingEnabled = false;

    return context;
  }

  private getColorPallette(frameIndex: number) {
    const colorPallette = new Map<number, [number, number, number, number]>();
    const palletteChunk = this.findFrameChunk<PalletteV3Chunk>(
      frameIndex,
      PALLETTE_CHUNK_V3
    );
    if (palletteChunk) {
      let i = palletteChunk.firstIndex;
      for (const color of palletteChunk.colors) {
        colorPallette.set(i, [
          color.color.red,
          color.color.green,
          color.color.blue,
          color.color.alpha,
        ]);

        i++;
      }
    }

    return colorPallette;
  }
}
