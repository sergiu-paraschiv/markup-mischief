import AnimationLoader from './AnimationLoader';
import AsepriteLoader from './AsepriteLoader';
import FrameLoader from './FrameLoader';
import TilemapLoader from './TilemapLoader';


export default class Aseprite {
  private readonly frameLoader: FrameLoader;
  private readonly animationLoader: AnimationLoader;
  private readonly tilemapLoader: TilemapLoader;

  static async load(src: string): Promise<Aseprite> {
    return new Aseprite(await AsepriteLoader.load(src));
  }

  constructor(private loader: AsepriteLoader) {
    this.frameLoader = new FrameLoader(loader);
    this.animationLoader = new AnimationLoader(loader);
    this.tilemapLoader = new TilemapLoader(loader);
  }

  ignoreLayers(names: string[]) {
    this.loader.ignoredLayerNames = names;
  }

  async getFrame(frameIndex: number) {
    return this.frameLoader.getFrame(frameIndex);
  }

  async getFrames(startIndex: number, endIndex: number) {
    return this.frameLoader.getFrames(startIndex, endIndex);
  }

  async getAnimation(animationName: string) {
    return this.animationLoader.getAnimation(animationName);
  }

  async getTilemap(tilemapName: string, frameIndex = 0) {
    return this.tilemapLoader.getTilemap(tilemapName, frameIndex);
  }
}
