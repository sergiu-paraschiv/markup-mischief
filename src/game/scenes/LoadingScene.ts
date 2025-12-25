import { GlobalContext, Scene, Vector } from '@engine/core';
import { AssetsInfo, AssetsLoader, CharsInfo } from '@engine/loaders';
import { AnimatedSprite } from '@engine/elements';

import { LayoutFlex, Text } from '@game/entities';

export default class Loading extends Scene {
  private progressText?: Text;
  private contentLayout?: LayoutFlex;

  constructor(
    private loadingAssetPath: string,
    private charsAssetInfo: CharsInfo['string']
  ) {
    super();
  }

  public async run() {
    const assetsLoader = new AssetsLoader();
    await assetsLoader.init(
      {
        Loading: {
          path: this.loadingAssetPath,
        },
      },
      { Chars: this.charsAssetInfo }
    );

    GlobalContext.set('chars', assetsLoader.chars);

    const animation = new AnimatedSprite(
      assetsLoader.assets['Loading'].animations['Big Map']
    );
    animation.animationSpeed = 0.5;

    // Create progress text
    this.progressText = new Text('', 2);
    this.progressText.fillColor = '#ffffff';
    this.progressText.setText('0%');

    // Create a vertical layout for animation and text
    this.contentLayout = new LayoutFlex(
      new Vector(0, 0),
      new Vector(animation.width, animation.height + 50) // Extra space for text
    );
    this.contentLayout.flexDirection = 'column';
    this.contentLayout.justifyContent = 'center';
    this.contentLayout.alignItems = 'center';
    this.contentLayout.gap = 0;
    this.contentLayout.addChild(animation);
    this.contentLayout.addChild(this.progressText);

    // Create main layout to center everything
    const mainLayout = new LayoutFlex(
      new Vector(0, 0),
      GlobalContext.get<Vector>('viewport')
    );
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(this.contentLayout);

    this.addChild(mainLayout);
  }

  public async loadAssets(assetsInfo: AssetsInfo, charsInfo: CharsInfo) {
    const assetsLoader = new AssetsLoader();
    await assetsLoader.init(assetsInfo, charsInfo, progress => {
      this.updateProgress(progress.percentage);
    });

    GlobalContext.set('assets', assetsLoader.assets);
    GlobalContext.set('chars', assetsLoader.chars);
  }

  private updateProgress(percentage: number) {
    // Update the text dynamically
    if (this.progressText) {
      const percentText = Math.floor(percentage).toString() + '%';
      this.progressText.setText(percentText);

      // Re-layout to account for potentially different text width
      if (this.contentLayout) {
        this.contentLayout.layout();
      }
    }
  }
}
