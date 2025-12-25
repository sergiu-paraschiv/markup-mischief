import { GlobalContext, Scene, Vector } from '@engine/core';
import { LayoutFlex, Button } from '@game/entities';
import { SpriteMash, SpriteMashData } from '@engine/elements';

import MainMenuBoardData from '../entities/MainMenuBoard.json';

interface MenuItem {
  label: string;
}

export default class MainMenuScene extends Scene {
  constructor(menuItems: MenuItem[]) {
    super();

    const board = SpriteMash.fromData(MainMenuBoardData as SpriteMashData);

    const menuLayout = new LayoutFlex(new Vector(0, 0), board.size);
    menuLayout.flexDirection = 'column';
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.gap = 8;

    for (const menuItem of menuItems) {
      menuLayout.addChild(new Button(new Vector(0, 0), menuItem.label));
    }

    board.addChild(menuLayout);

    // Create main layout to center everything
    const mainLayout = new LayoutFlex(
      new Vector(0, 0),
      GlobalContext.get<Vector>('viewport')
    );
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(board);

    this.addChild(mainLayout);
  }
}
