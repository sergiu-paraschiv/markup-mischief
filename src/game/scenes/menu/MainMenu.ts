import { Node2D } from '@engine/elements';
import { Vector } from '@engine/core';
import { LayoutFlex, Button, Text, PrimaryBoard } from '@game/entities';

export interface MenuItem {
  label: string;
  action?: () => void;
}

export default class MainMenu extends Node2D {
  private board: Node2D;
  private menuLayout: LayoutFlex;

  constructor(
    position: Vector,
    menuItems: MenuItem[],
    backAction?: () => void
  ) {
    super(position);

    // Create back button if needed
    let backButton: Button | undefined;
    if (backAction) {
      const backText = new Text();
      backText.setTextFromCodes([53]);
      backButton = new Button(new Vector(0, 0), backText);
      backButton.action = backAction;
    }

    // Create menu buttons and measure them
    const buttons: Button[] = [];
    let maxWidth = 0;
    let totalHeight = 0;
    const gap = 8;

    for (const menuItem of menuItems) {
      const buttonText = new Text(menuItem.label);
      const button = new Button(new Vector(0, 0), buttonText);
      button.action = menuItem.action;
      buttons.push(button);

      maxWidth = Math.max(maxWidth, button.width);
      totalHeight += button.height;
    }

    // Add gap space between buttons
    totalHeight += gap * (buttons.length - 1);

    // Calculate board size with padding
    const padding = new Vector(20, 20);
    const boardSize = new Vector(maxWidth, totalHeight).add(padding.mul(2));

    // Create the board with measured size
    this.board = new PrimaryBoard(new Vector(0, 0), boardSize);

    // Add back button to the board if provided
    if (backButton) {
      this.board.addChild(backButton);
    }

    // Create the layout with the measured size
    this.menuLayout = new LayoutFlex(new Vector(0, 0), boardSize);
    this.menuLayout.flexDirection = 'column';
    this.menuLayout.justifyContent = 'center';
    this.menuLayout.alignItems = 'center';
    this.menuLayout.gap = gap;

    // Add buttons to the layout
    for (const button of buttons) {
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
