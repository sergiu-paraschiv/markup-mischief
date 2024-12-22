/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parser } from 'binary-parser';

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
export type PalletteV3Chunk = ReturnType<typeof palletteChunkParser.parse>;

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
export type LayerChunk = ReturnType<typeof layerChunkParser.parse>;

const celChunkLinkedFrameParser = new Parser()
  .endianness('little')
  .uint16('linkedFrame');
export type CelChunkLinkedFrame = ReturnType<
  typeof celChunkLinkedFrameParser.parse
>;

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
export type CelChunkCompressedImage = ReturnType<
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

export const LINKED_FRAME_CEL_TYPE = 1;
export const COMPRESSED_IMAGE_CEL_TYPE = 2;
export const COMPRESSED_TILEMAP_CEL_TYPE = 3;

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

export type CelChunk = ReturnType<typeof celChunkParser.parse>;

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
export type TagsChunk = ReturnType<typeof tagsChunkParser.parse>;

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
export type TilesetChunk = ReturnType<typeof tilesetChunkParser.parse>;

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

export const LAYER_CHUNK = 0x2004;
export const CEL_CHUNK = 0x2005;
export const TAGS_CHUNK = 0x2018;
const PALLETTE_CHUNK_V1 = 0x0004;
const PALLETTE_CHUNK_V2 = 0x0011;
export const PALLETTE_CHUNK_V3 = 0x2019;
export const TILESET_CHUNK = 0x2023;

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

export const mainParser = (
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
