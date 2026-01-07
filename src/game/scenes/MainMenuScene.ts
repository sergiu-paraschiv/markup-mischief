import { GlobalContext, Scene, Vector } from '@engine/core';
import { FixedSizeLayoutFlex } from '@game/entities';
import { SceneLoadedEvent } from '@engine';

import MainMenu, { MenuItem } from './menu/MainMenu';

export default class MainMenuScene extends Scene {
  private menu: MainMenu;

  constructor(menuItems: MenuItem[], backAction?: () => void) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');
    this.menu = new MainMenu(new Vector(0, 0), menuItems, backAction);

    const mainLayout = new FixedSizeLayoutFlex(new Vector(0, 0), viewport);
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(this.menu);

    this.addChild(mainLayout);

    // Listen for scene loaded event to trigger autofocus
    this.on(SceneLoadedEvent, () => {
      this.menu.triggerAutofocus();
    });
  }
}
