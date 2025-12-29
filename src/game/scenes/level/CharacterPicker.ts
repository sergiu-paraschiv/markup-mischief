import { Node2D } from '@engine/elements';
import { Vector } from '@engine/core';
import { Button, Text, LayoutFlex } from '@game/entities';
import CharacterSelectionManager, {
  AVAILABLE_CHARACTERS,
} from '../../CharacterSelectionManager';

export default class CharacterPicker extends Node2D {
  private characterButtons: Button[] = [];
  private layout: LayoutFlex;
  private selectionManager: CharacterSelectionManager;
  private onChange?: () => void;

  constructor(onChange?: () => void) {
    super();
    this.onChange = onChange;

    this.selectionManager = CharacterSelectionManager.getInstance();
    const selectedType = this.selectionManager.getSelectedCharacterType();

    // Create buttons for each character
    for (const character of AVAILABLE_CHARACTERS) {
      const buttonText = new Text(character.name);
      const isSelected = character.type === selectedType;
      const button = new Button(
        new Vector(0, 0),
        buttonText,
        isSelected ? 'primary' : 'secondary'
      );

      button.action = () => {
        this.selectCharacter(character.type);
      };

      this.characterButtons.push(button);
    }

    // Create horizontal layout for buttons
    const totalWidth = this.characterButtons.reduce(
      (sum, btn) => sum + btn.width,
      0
    );
    const gap = 8;
    const layoutWidth = totalWidth + gap * (this.characterButtons.length - 1);

    this.layout = new LayoutFlex(
      new Vector(0, 0),
      new Vector(layoutWidth, this.characterButtons[0].height)
    );
    this.layout.flexDirection = 'row';
    this.layout.justifyContent = 'center';
    this.layout.alignItems = 'center';
    this.layout.gap = gap;

    for (const button of this.characterButtons) {
      this.layout.addChild(button);
    }

    this.addChild(this.layout);
  }

  private selectCharacter(type: string) {
    this.selectionManager.setSelectedCharacterType(
      type as 'PinkStar' | 'Crabby' | 'FierceTooth'
    );

    // Update button styles
    const selectedType = this.selectionManager.getSelectedCharacterType();
    for (let i = 0; i < AVAILABLE_CHARACTERS.length; i++) {
      const character = AVAILABLE_CHARACTERS[i];
      const button = this.characterButtons[i];

      // Recreate button with new variant
      const buttonText = new Text(character.name);
      const isSelected = character.type === selectedType;
      const newButton = new Button(
        new Vector(0, 0),
        buttonText,
        isSelected ? 'primary' : 'secondary'
      );

      newButton.action = () => {
        this.selectCharacter(character.type);
      };

      // Replace in layout
      this.layout.removeChild(button);
      this.layout.addChild(newButton);
      this.characterButtons[i] = newButton;
    }

    // Trigger onChange callback
    if (this.onChange) {
      this.onChange();
    }
  }

  override get width() {
    return this.layout.width;
  }

  override get height() {
    return this.layout.height;
  }
}
