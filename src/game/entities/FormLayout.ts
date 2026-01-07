import { Node2D } from '@engine/elements';
import { Vector, GlobalContext } from '@engine/core';
import {
  LayoutFlex,
  FixedSizeLayoutFlex,
  Button,
  Text,
  Board,
  Box,
  Layout3Slice,
} from '@game/entities';
import { AssetsMap } from '@engine/loaders';
import Input from './Input';

/**
 * Container that reports specific dimensions for layout purposes
 */
class SizedContainer extends Node2D {
  constructor(
    position: Vector,
    private _width: number,
    private _height: number
  ) {
    super(position);
  }

  override get width(): number {
    return this._width;
  }

  override get height(): number {
    return this._height;
  }
}

export interface FormLayoutConfig {
  title: string;
  inputs: {
    key: string;
    placeholder: string;
    type?: 'text' | 'password' | 'email';
    width?: number;
    name?: string;
    autocomplete?: AutoFill;
  }[];
  mainAction: {
    label: string;
    onAction: (values: Record<string, string>) => void;
  };
  secondaryActions?: {
    label: string;
    onAction: () => void;
  }[];
  backAction?: () => void;
  errorMessage?: string;
}

export default class FormLayout extends Node2D {
  private board: Board;
  private formBox: Box;
  private formLayout: LayoutFlex;
  private inputElements = new Map<string, Input>();
  private mainButton: Button;
  private secondaryButtons: Button[] = [];
  private errorPlaceholder: Box;
  private formElement: HTMLFormElement;

  constructor(position: Vector, config: FormLayoutConfig) {
    super(position);

    // Create HTML form element to wrap all inputs for password manager support
    this.formElement = document.createElement('form');
    this.formElement.setAttribute('data-interactive', 'true');
    this.formElement.setAttribute('data-no-auto-position', 'true'); // Don't let renderer position this
    this.formElement.style.position = 'absolute';
    this.formElement.style.left = '0';
    this.formElement.style.top = '0';

    this.attachedDOM = this.formElement;

    // Prevent default form submission
    this.formElement.addEventListener('submit', e => {
      e.preventDefault();
      // Trigger the main action when form is submitted (e.g., Enter key)
      const values: Record<string, string> = {};
      for (const [key, input] of this.inputElements) {
        values[key] = input.value;
      }
      config.mainAction.onAction(values);
    });

    // Create back button if provided
    let backButton: Button | undefined;
    if (config.backAction) {
      const backText = new Text();
      backText.setTextFromCodes([53]); // Back arrow character
      backButton = new Button(new Vector(0, 0), backText, 'secondary');
      backButton.action = config.backAction;
    }

    // Create form layout with dynamic sizing
    this.formLayout = new LayoutFlex(new Vector(0, 0));
    this.formLayout.flexDirection = 'column';
    this.formLayout.alignItems = 'center';
    this.formLayout.gap = 0;

    // Title (hero style)
    const titleText = new Text(config.title, 0, 'hero');
    this.formLayout.addChild(titleText);

    // Input fields
    for (const inputConfig of config.inputs) {
      const input = new Input(new Vector(0, 0), {
        width: inputConfig.width || 200,
        placeholder: inputConfig.placeholder,
        type: inputConfig.type || 'text',
        name: inputConfig.name,
        autocomplete: inputConfig.autocomplete,
      });
      this.inputElements.set(inputConfig.key, input);
      this.formLayout.addChild(input);

      // Append input element to form for proper DOM nesting
      // The renderer will detect it already has a parent and won't re-append it
      this.formElement.appendChild(input.getInputElement());
    }

    // Error placeholder (dynamically sized based on content)
    this.errorPlaceholder = new Box(new Vector(0, 0), {}, {});
    this.formLayout.addChild(this.errorPlaceholder);

    // Main action button
    const mainButtonText = new Text(config.mainAction.label);
    this.mainButton = new Button(new Vector(0, 0), mainButtonText, 'primary');
    this.mainButton.action = () => {
      const values: Record<string, string> = {};
      for (const [key, input] of this.inputElements) {
        values[key] = input.value;
      }
      config.mainAction.onAction(values);
    };
    this.formLayout.addChild(this.mainButton);

    // Set button type to submit and append to form
    this.mainButton.setButtonType('submit');
    this.formElement.appendChild(this.mainButton.getButtonElement());

    // Secondary action buttons (text variant) - horizontal layout
    if (config.secondaryActions && config.secondaryActions.length > 0) {
      let secondaryActionsWidth = 0;
      let secondaryActionsHeight = 0;

      // Create buttons
      for (const action of config.secondaryActions) {
        const buttonText = new Text(action.label);
        const button = new Button(new Vector(0, 0), buttonText, 'text');
        button.action = action.onAction;
        this.secondaryButtons.push(button);
        secondaryActionsWidth += button.width;
        secondaryActionsHeight = Math.max(
          secondaryActionsHeight,
          button.height
        );
      }

      // Add gap between buttons
      const buttonGap = 8;
      secondaryActionsWidth += buttonGap * (this.secondaryButtons.length - 1);

      // Create horizontal layout for secondary actions with fixed size
      const secondaryActionsLayout = new FixedSizeLayoutFlex(
        new Vector(0, 0),
        new Vector(secondaryActionsWidth, secondaryActionsHeight)
      );
      secondaryActionsLayout.flexDirection = 'row';
      secondaryActionsLayout.alignItems = 'center';
      secondaryActionsLayout.justifyContent = 'center';
      secondaryActionsLayout.gap = buttonGap;

      for (const button of this.secondaryButtons) {
        secondaryActionsLayout.addChild(button);
      }

      // Wrap in container with margin
      const topMargin = 8;
      const bottomMargin = 8;
      const secondaryActionsContainer = new SizedContainer(
        new Vector(0, 0),
        secondaryActionsWidth,
        secondaryActionsHeight + topMargin + bottomMargin
      );
      secondaryActionsLayout.position = new Vector(0, topMargin);
      secondaryActionsContainer.addChild(secondaryActionsLayout);

      this.formLayout.addChild(secondaryActionsContainer);
    }

    // Wrap form layout in a box with padding
    this.formBox = new Box(
      new Vector(0, 0),
      {},
      { top: 16, right: 16, bottom: 16, left: 16 },
      0
    );
    this.formBox.setContent(this.formLayout);

    // Create the board with Box's computed size
    this.board = new Board(
      new Vector(0, 0),
      new Vector(this.formBox.width, this.formBox.height),
      'primary',
      false,
      'none'
    );

    // Add back button to the board as overlay if provided (upper-left corner)
    // Using addOverlay ensures it always renders on top, even after board resize
    if (backButton) {
      this.board.addOverlay(backButton);
    }

    this.addChild(this.board);
    this.addChild(this.formBox);
  }

  private getInput(key: string) {
    return this.inputElements.get(key);
  }

  /**
   * Get input value by key
   */
  public getInputValue(key: string): string {
    const input = this.getInput(key);
    return input?.value || '';
  }

  /**
   * Set input value by key
   */
  public setInputValue(key: string, value: string): void {
    const input = this.getInput(key);
    if (!input) {
      throw new Error(`Unknown input "${key}"`);
    }
    input.value = value;
  }

  /**
   * Clear all inputs
   */
  public clearInputs(): void {
    for (const input of this.inputElements.values()) {
      input.clear();
    }
  }

  /**
   * Show error message and reflow layout
   */
  public showError(message: string): void {
    const error = this.getErrorElement(message);
    this.errorPlaceholder.setContent(error);

    // LayoutFlex automatically recomputes layout when dimensions are accessed
    // Update board size to match new dimensions
    this.board.setSize(new Vector(this.formBox.width, this.formBox.height));
  }

  /**
   * Hide error message and reflow layout
   */
  public hideError(): void {
    // Remove content from error placeholder
    if (this.errorPlaceholder['content']) {
      this.errorPlaceholder.removeChild(this.errorPlaceholder['content']);
      this.errorPlaceholder['content'] = undefined;
    }

    // LayoutFlex automatically recomputes layout when dimensions are accessed
    // Update board size to match new dimensions
    this.board.setSize(new Vector(this.formBox.width, this.formBox.height));
  }

  /**
   * Enable/disable all buttons
   */
  public setButtonsEnabled(enabled: boolean): void {
    this.mainButton.setDisabled(!enabled);
    for (const button of this.secondaryButtons) {
      button.setDisabled(!enabled);
    }
  }

  override get width(): number {
    return this.formBox.width;
  }

  override get height(): number {
    return this.formBox.height;
  }

  private getErrorElement(message: string) {
    const assets = GlobalContext.get<AssetsMap>('assets');
    const tilemap = assets['Wood and Paper UI'].tilemaps['Wood and Paper'];

    const errorText = new Text(message);
    errorText.fillColor = '#000000';

    const startCapWidth = tilemap.get(211)?.width ?? 0;
    const endCapWidth = tilemap.get(213)?.width ?? 0;

    // Create paper background (3-slice) for error message
    const errorBg = new Layout3Slice(
      errorText.width + startCapWidth + endCapWidth,
      tilemap.get(211), // left
      tilemap.get(212), // middle
      tilemap.get(213) // right
    );

    // Position error text on top of background with padding
    errorText.position = new Vector(startCapWidth, 15);

    // Create container for background + text with proper dimensions
    const errorContainer = new SizedContainer(
      new Vector(0, 0),
      errorBg.width,
      errorBg.height
    );
    errorContainer.addChild(errorBg);
    errorContainer.addChild(errorText);

    return errorContainer;
  }
}
