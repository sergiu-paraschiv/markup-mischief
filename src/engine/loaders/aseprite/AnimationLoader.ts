import { Animation } from '@engine/elements';
import AsepriteCache from './AsepriteCache';
import AsepriteLoader from './AsepriteLoader';
import { TagsChunk, TAGS_CHUNK } from './AsepriteParser';
import FrameLoader from './FrameLoader';

export default class AnimationLoader {
  private static animationCache = new AsepriteCache<Animation>();
  private frameLoader: FrameLoader;

  constructor(private loader: AsepriteLoader) {
    this.frameLoader = new FrameLoader(loader);
  }

  async getAnimation(animationName: string): Promise<Animation> {
    return AnimationLoader.animationCache.get(animationName, async () => {
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

      return {
        frames: await this.frameLoader.getFrames(
          animationTag.fromFrame,
          animationTag.toFrame
        ),
        direction: animationTag.loopAnimationDirection,
        repeat:
          animationTag.repeatAnimation <= 2 ? animationTag.repeatAnimation : 3,
        repeatTimes:
          animationTag.repeatAnimation <= 2 ? 0 : animationTag.repeatAnimation,
      };
    });
  }
}
