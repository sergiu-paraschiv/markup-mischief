import { GlobalContext, Scene, Vector } from '@engine/core';
import { FixedSizeLayoutFlex } from '@game/entities';

import MainMenu, { MenuItem } from './menu/MainMenu';

export default class MainMenuScene extends Scene {
  constructor(menuItems: MenuItem[], backAction?: () => void) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');
    const menu = new MainMenu(new Vector(0, 0), menuItems, backAction);

    const mainLayout = new FixedSizeLayoutFlex(new Vector(0, 0), viewport);
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(menu);

    this.addChild(mainLayout);
  }
}
