import { inflate } from 'pako';
import { AnimationFrame } from '@engine/elements';
import Texture from '../Texture';
import AsepriteCache from './AsepriteCache';
import AsepriteLoader from './AsepriteLoader';
import {
  CelChunkLinkedFrame,
  LINKED_FRAME_CEL_TYPE,
  LAYER_CHUNK,
  LayerChunk,
  CEL_CHUNK,
  CelChunk,
  COMPRESSED_IMAGE_CEL_TYPE,
  CelChunkCompressedImage,
} from './AsepriteParser';
import ColorPalletteLoader from './ColorPalletteLoader';

export default class FrameLoader {
  private static frameCache = new AsepriteCache<AnimationFrame>();
  private collorPalletteLoader: ColorPalletteLoader;

  constructor(private loader: AsepriteLoader) {
    this.collorPalletteLoader = new ColorPalletteLoader(loader);
  }

  async getFrame(frameIndex: number): Promise<AnimationFrame> {
    return FrameLoader.frameCache.get(frameIndex.toString(10), async () => {
      if (!this.loader.data) {
        throw new Error('Aseprite file not loaded!');
      }

      const frameData = this.loader.data.frames[frameIndex];

      const context = this.getDrawContext();
      const colorPallette = this.collorPalletteLoader.getColorPallette(0);

      const layers = this.loader.findFrameChunks<LayerChunk>(0, LAYER_CHUNK);
      const celChunks = this.loader.findFrameChunks<CelChunk>(frameIndex, CEL_CHUNK);

      for (const celChunk of celChunks) {
        if (celChunk.cellType === LINKED_FRAME_CEL_TYPE) {
          const linkedFrame = await this.getFrame(
            (celChunk.data as unknown as CelChunkLinkedFrame).linkedFrame
          );
          const layer = layers[celChunk.layerIndex];
          if (
            (layer.flags & 0x1) === 1 &&
            !this.loader.ignoredLayerNames.includes(layer.name.value)
          ) {
            context.save();
            context.drawImage(linkedFrame.texture.data, 0, 0);
            context.restore();
          }
        } else if (celChunk.cellType === COMPRESSED_IMAGE_CEL_TYPE) {
          const layer = layers[celChunk.layerIndex];
          if (
            (layer.flags & 0x1) === 1 &&
            !this.loader.ignoredLayerNames.includes(layer.name.value)
          ) {
            const compressedImageCelChunk =
              celChunk.data as unknown as CelChunkCompressedImage;
            const compressedData = compressedImageCelChunk.rawCompressed;
            const decompressedData = inflate(new Uint8Array(compressedData));
            const rgbaData = colorPallette.rawDataToRGBA(
              decompressedData,
              this.loader.data.header.colorDepth,
              this.loader.data.header.transparentIndex
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
        this.loader.data.header.width,
        this.loader.data.header.height
      );
      const imageBitmap = await createImageBitmap(imageData);

      return {
        texture: Texture.fromImageBitmap(imageBitmap),
        duration: frameData.header.frameDuration,
      };
    });
  }

  async getFrames(startIndex: number, endIndex: number) {
    const frames: AnimationFrame[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      frames.push(await this.getFrame(i));
    }

    return frames;
  }

  private getDrawContext() {
    const canvas = new OffscreenCanvas(
      this.loader.data?.header.width || 0,
      this.loader.data?.header.height || 0
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
}
