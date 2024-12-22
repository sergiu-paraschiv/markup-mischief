import AsepriteLoader from './AsepriteLoader';
import { PalletteV3Chunk, PALLETTE_CHUNK_V3 } from './AsepriteParser';

type Color = [number, number, number, number];
class ColorPallette {
  private data = new Map<number, Color>();

  get(index: number) {
    return this.data.get(index);
  }

  set(index: number, color: Color) {
    this.data.set(index, color);
  }

  rawDataToRGBA(
    data: Uint8Array,
    colorDepth: number,
    transparentIndex: number
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
          color = this.get(data[source]) ?? [255, 255, 255, 0];
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
}

export default class ColorPalletteLoader {
  constructor(private loader: AsepriteLoader) {}

  getColorPallette(frameIndex: number) {
    const colorPallette = new ColorPallette();
    const palletteChunk = this.loader.findFrameChunk<PalletteV3Chunk>(
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
