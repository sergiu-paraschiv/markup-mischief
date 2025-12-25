import { GlobalContext, Scene, Vector } from '@engine/core';
import { LayoutFlex, MainMenu, MenuItem } from '@game/entities';

export default class MainMenuScene extends Scene {
  constructor(menuItems: MenuItem[], backAction?: () => void) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');
    const menu = new MainMenu(new Vector(0, 0), menuItems, backAction);

    // Create main layout to center everything
    const mainLayout = new LayoutFlex(new Vector(0, 0), viewport);
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(menu);

    this.addChild(mainLayout);
  }
}
