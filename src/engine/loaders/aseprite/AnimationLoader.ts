import { Animation } from '@engine/elements';
import AsepriteCache from './AsepriteCache';
import AsepriteLoader from './AsepriteLoader';
import { TagsChunk, TAGS_CHUNK } from './AsepriteParser';
import FrameLoader from './FrameLoader';

export default class AnimationLoader {
  private animationCache = new AsepriteCache<Animation>();
  private frameLoader: FrameLoader;

  constructor(private loader: AsepriteLoader) {
    this.frameLoader = new FrameLoader(loader);
  }

  getAnimationNames(): string[] {
    if (!this.loader.data) {
      throw new Error('Aseprite file not loaded!');
    }

    const tagsChunk = this.loader.findFrameChunk<TagsChunk>(0, TAGS_CHUNK);
    if (!tagsChunk) {
      return [];
    }

    return tagsChunk.tags.map(tag => tag.tagName.value);
  }

  async getAnimation(animationName: string): Promise<Animation> {
    return this.animationCache.get(animationName, async () => {
      if (!this.loader.data) {
        throw new Error('Aseprite file not loaded!');
      }

      const tagsChunk = this.loader.findFrameChunk<TagsChunk>(0, TAGS_CHUNK);
      if (!tagsChunk) {
        throw Error('Aseprite file has no tags!');
      }

      const animationTag = tagsChunk.tags.find(
        tag => tag.tagName.value === animationName
      );
      if (!animationTag) {
        throw Error(`Animation with name ${animationName} not found !`);
      }

      const frames = await this.frameLoader.getFrames(
        animationTag.fromFrame,
        animationTag.toFrame
      );

      return {
        duration: frames.map(f => f.duration).reduce((a, b) => a + b, 0),
        frames,
        direction: animationTag.loopAnimationDirection,
        repeat:
          animationTag.repeatAnimation <= 2 ? animationTag.repeatAnimation : 3,
        repeatTimes:
          animationTag.repeatAnimation <= 2 ? 0 : animationTag.repeatAnimation,
      };
    });
  }
}
