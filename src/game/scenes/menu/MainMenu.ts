import { Node2D, SpriteMash, SpriteMashData } from '@engine/elements';
import { Vector } from '@engine/core';
import { LayoutFlex, Button, Text } from '@game/entities';

import MainMenuBoardData from './MainMenuBoard.json';

export interface MenuItem {
  label: string;
  action?: () => void;
}

export default class MainMenu extends Node2D {
  private board: SpriteMash;
  private menuLayout: LayoutFlex;

  constructor(
    position: Vector,
    menuItems: MenuItem[],
    backAction?: () => void
  ) {
    super(position);

    this.board = SpriteMash.fromData(MainMenuBoardData as SpriteMashData);

    // Add back button to the board if backAction is provided
    if (backAction) {
      const backText = new Text();
      backText.setTextFromCodes([53]);
      const backButton = new Button(new Vector(0, 0), backText);
      backButton.action = backAction;
      this.board.addChild(backButton);
    }

    this.menuLayout = new LayoutFlex(new Vector(0, 0), this.board.size);
    this.menuLayout.flexDirection = 'column';
    this.menuLayout.justifyContent = 'center';
    this.menuLayout.alignItems = 'center';
    this.menuLayout.gap = 8;

    for (const menuItem of menuItems) {
      const buttonText = new Text(menuItem.label);
      const button = new Button(new Vector(0, 0), buttonText);
      button.action = menuItem.action;
      this.menuLayout.addChild(button);
    }

    this.board.addChild(this.menuLayout);
    this.addChild(this.board);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
