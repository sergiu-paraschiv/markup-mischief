import { Node2D } from '@engine/elements';
import { Vector } from '@engine/core';
import {
  LayoutFlex,
  Button,
  Text,
  Board,
  ButtonVariant,
  Box,
} from '@game/entities';

export interface MenuItem {
  label: string;
  action?: () => void;
  variant?: ButtonVariant;
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
      backButton = new Button(new Vector(0, 0), backText, 'secondary');
      backButton.action = backAction;
    }

    // Create menu buttons and measure them
    const buttons: Button[] = [];
    let maxWidth = 0;
    let totalHeight = 0;
    const gap = 8;

    for (const menuItem of menuItems) {
      const buttonText = new Text(menuItem.label);
      const button = new Button(new Vector(0, 0), buttonText, menuItem.variant);
      button.action = menuItem.action;
      buttons.push(button);

      maxWidth = Math.max(maxWidth, button.width);
      totalHeight += button.height;
    }

    // Add gap space between buttons
    totalHeight += gap * (buttons.length - 1);

    // Create title with margin
    const titleText = new Text('Markup Mischief', 1, 'hero');
    const titleBox = new Box(new Vector(0, 0), { top: 20 }, {});
    titleBox.setContent(titleText);

    // Create menu layout
    this.menuLayout = new LayoutFlex(
      new Vector(0, 0),
      new Vector(maxWidth, totalHeight)
    );
    this.menuLayout.flexDirection = 'column';
    this.menuLayout.justifyContent = 'center';
    this.menuLayout.alignItems = 'center';
    this.menuLayout.gap = gap;

    // Add buttons to the layout
    for (const button of buttons) {
      this.menuLayout.addChild(button);
    }

    // Wrap menu layout in a box with padding
    const menuBox = new Box(new Vector(0, 0), {}, { top: 0, bottom: 20 });
    menuBox.setContent(this.menuLayout);

    // Create container for title and menu
    const contentLayout = new LayoutFlex(
      new Vector(0, 0),
      new Vector(
        Math.max(titleBox.width, menuBox.width),
        titleBox.height + menuBox.height
      )
    );
    contentLayout.flexDirection = 'column';
    contentLayout.alignItems = 'center';
    contentLayout.addChild(titleBox);
    contentLayout.addChild(menuBox);

    // Wrap everything in a box with padding for the board
    const boardContentBox = new Box(
      new Vector(0, 0),
      {},
      { top: 20, right: 20, bottom: 20, left: 20 }
    );
    boardContentBox.setContent(contentLayout);

    // Create the board with measured size
    const boardSize = new Vector(boardContentBox.width, boardContentBox.height);
    this.board = new Board(new Vector(0, 0), boardSize, 'primary', true);

    // Add back button to the board if provided
    if (backButton) {
      this.board.addChild(backButton);
    }

    this.board.addChild(boardContentBox);
    this.addChild(this.board);
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
