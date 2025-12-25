import { GlobalContext, Scene, Vector } from '@engine/core';
import { LayoutFlex } from '@game/entities';
import { SpriteMash, SpriteMashData } from '@engine/elements';

import MainMenuBoardData from '../entities/MainMenuBoard.json';

export default class MainMenuScene extends Scene {
  constructor() {
    super();

    // Create main layout to center everything
    const mainLayout = new LayoutFlex(
      new Vector(0, 0),
      GlobalContext.get<Vector>('viewport')
    );
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(
      SpriteMash.fromData(MainMenuBoardData as SpriteMashData)
    );

    this.addChild(mainLayout);
  }
}
