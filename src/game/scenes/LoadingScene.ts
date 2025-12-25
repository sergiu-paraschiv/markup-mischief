import { Scene } from '@engine/core';
import { AssetsLoader } from '@engine/loaders';
import { AnimatedSprite } from '@engine/elements';

export default class Loading extends Scene {
  constructor(private loadingAssetPath: string) {
    super();

    this.run();
  }

  private async run() {
    const assetsLoader = new AssetsLoader();
    await assetsLoader.init({ Loading: this.loadingAssetPath });

    const animation = new AnimatedSprite(
      assetsLoader.assets['Loading'].animations['Big Map']
    );
    animation.animationSpeed = 0.5;
    this.addChild(animation);
  }
}
