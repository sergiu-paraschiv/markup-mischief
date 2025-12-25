import { GlobalContext, Scene, Vector } from '@engine/core';
import { LayoutFlex, Button, Text } from '@game/entities';
import { SpriteMash, SpriteMashData } from '@engine/elements';

import MainMenuBoardData from '../entities/MainMenuBoard.json';

interface MenuItem {
  label: string;
  action?: () => void;
}

export default class MainMenuScene extends Scene {
  constructor(menuItems: MenuItem[], backAction?: () => void) {
    super();

    const viewport = GlobalContext.get<Vector>('viewport');
    const board = SpriteMash.fromData(MainMenuBoardData as SpriteMashData);

    // Add back button to the board if backAction is provided
    if (backAction) {
      const backText = new Text();
      backText.setTextFromCodes([53]);
      const backButton = new Button(new Vector(0, 0), backText);
      backButton.action = backAction;
      board.addChild(backButton);
    }

    const menuLayout = new LayoutFlex(new Vector(0, 0), board.size);
    menuLayout.flexDirection = 'column';
    menuLayout.justifyContent = 'center';
    menuLayout.alignItems = 'center';
    menuLayout.gap = 8;

    for (const menuItem of menuItems) {
      const buttonText = new Text(menuItem.label);
      const button = new Button(new Vector(0, 0), buttonText);
      button.action = menuItem.action;
      menuLayout.addChild(button);
    }

    board.addChild(menuLayout);

    // Create main layout to center everything
    const mainLayout = new LayoutFlex(new Vector(0, 0), viewport);
    mainLayout.justifyContent = 'center';
    mainLayout.alignItems = 'center';
    mainLayout.addChild(board);

    this.addChild(mainLayout);
  }
}
