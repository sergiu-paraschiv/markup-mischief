import { Node2D } from '@engine/elements';
import { Vector } from '@engine/core';
import { KeyboardInputEvent, KeyAction } from '@engine/input';
import {
  LayoutFlex,
  Button,
  Text,
  Board,
  ButtonVariant,
  Box,
} from '@game/entities';

export type MenuItem =
  | {
      type: 'button';
      label: string;
      action?: () => void;
      variant?: ButtonVariant;
    }
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'custom';
      element: Node2D;
    };

export default class MainMenu extends Node2D {
  private board: Node2D;
  private menuLayout: LayoutFlex;
  private overlayDiv: HTMLDivElement;
  private buttons: Button[] = [];
  private currentFocusIndex = 0;

  constructor(
    position: Vector,
    menuItems: MenuItem[],
    backAction?: () => void
  ) {
    super(position);

    // Create a DOM mask to hide attachedDOM elements underneath (like tag text)
    // This is invisible but tells the renderer to hide intersecting elements
    this.overlayDiv = document.createElement('div');
    this.overlayDiv.setAttribute('data-mask', 'true'); // Mark as mask element
    this.overlayDiv.style.position = 'absolute';
    this.overlayDiv.style.pointerEvents = 'none';
    this.overlayDiv.style.visibility = 'hidden'; // Mask itself is invisible
    this.attachedDOM = this.overlayDiv;

    // Create back button if needed
    let backButton: Button | undefined;
    if (backAction) {
      const backText = new Text();
      backText.setTextFromCodes([53]);
      backButton = new Button(new Vector(0, 0), backText, 'secondary');
      backButton.action = backAction;
    }

    // Create menu buttons/text items and measure them
    const menuElements: Node2D[] = [];
    let maxWidth = 0;
    let totalHeight = 0;
    const gap = 8;

    for (const menuItem of menuItems) {
      let element: Node2D;

      if (menuItem.type === 'button') {
        const buttonText = new Text(menuItem.label);
        const button = new Button(
          new Vector(0, 0),
          buttonText,
          menuItem.variant
        );
        button.action = menuItem.action;
        element = button;
        this.buttons.push(button);
      } else if (menuItem.type === 'text') {
        element = new Text(menuItem.text, 0);
      } else {
        element = menuItem.element;
      }

      menuElements.push(element);

      maxWidth = Math.max(maxWidth, element.width);
      totalHeight += element.height;
    }

    // Add gap space between elements
    totalHeight += gap * (menuElements.length - 1);

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

    for (const element of menuElements) {
      this.menuLayout.addChild(element);
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

    // Update overlay size to match the board
    this.overlayDiv.style.width = `${this.board.width}px`;
    this.overlayDiv.style.height = `${this.board.height}px`;

    // Set up keyboard navigation
    this.on(KeyboardInputEvent, this.handleKeyboardInput.bind(this));

    // Auto-focus first button if any exist
    if (this.buttons.length > 0) {
      this.setFocusedButton(0);
    }
  }

  private handleKeyboardInput(event: KeyboardInputEvent): void {
    if (event.action !== KeyAction.DOWN || this.buttons.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
        this.moveFocusUp();
        break;
      case 'ArrowDown':
      case 's':
        this.moveFocusDown();
        break;
      case 'Enter':
      case ' ':
        this.activateFocusedButton();
        break;
    }
  }

  private moveFocusUp(): void {
    const newIndex =
      this.currentFocusIndex > 0
        ? this.currentFocusIndex - 1
        : this.buttons.length - 1;
    this.setFocusedButton(newIndex);
  }

  private moveFocusDown(): void {
    const newIndex =
      this.currentFocusIndex < this.buttons.length - 1
        ? this.currentFocusIndex + 1
        : 0;
    this.setFocusedButton(newIndex);
  }

  private setFocusedButton(index: number): void {
    // Unfocus previous button
    if (this.buttons[this.currentFocusIndex]) {
      this.buttons[this.currentFocusIndex].setFocused(false);
    }

    // Focus new button
    this.currentFocusIndex = index;
    if (this.buttons[this.currentFocusIndex]) {
      this.buttons[this.currentFocusIndex].setFocused(true);
    }
  }

  private activateFocusedButton(): void {
    if (this.buttons[this.currentFocusIndex]) {
      this.buttons[this.currentFocusIndex].activate();
    }
  }

  override get width() {
    return this.board.width;
  }

  override get height() {
    return this.board.height;
  }
}
