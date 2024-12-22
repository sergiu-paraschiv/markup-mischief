import { mainParser } from './AsepriteParser';
import AsepriteCache from './AsepriteCache';

export default class AsepriteLoader {
  private static asepriteCache = new AsepriteCache<AsepriteLoader>();
  public data: ReturnType<typeof mainParser.parse> | undefined;
  public ignoredLayerNames: string[] = [];

  static async load(src: string): Promise<AsepriteLoader> {
    return AsepriteLoader.asepriteCache.get(src, async () => {
      const aseprite = new AsepriteLoader();
      const response = await fetch(src);
      const buffer = await response.arrayBuffer();

      aseprite.data = mainParser.parse(new Uint8Array(buffer) as Buffer);
      if (aseprite.data.header.magicNumber !== 0xa5e0) {
        throw Error('Invalid Aseprite file header magic number!');
      }

      return aseprite;
    });
  }

  findFrameChunks<T>(frameIndex: number, ofType: number): T[] {
    if (!this.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const frameData = this.data.frames[frameIndex];

    const chunks = frameData.chunks.filter(chunk => chunk.chunkType === ofType);

    return chunks.map(chunk => chunk.data) as T[];
  }

  findFrameChunk<T>(frameIndex: number, ofType: number): T | undefined {
    const chunks = this.findFrameChunks<T>(frameIndex, ofType);
    if (chunks.length === 1) {
      return chunks[0];
    } else if (chunks.length === 0) {
      return undefined;
    }

    throw new Error(`Multiple Chunks of type ${ofType} found!`);
  }
}
