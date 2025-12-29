import Character from './entities/characters/Character';
import Player1, { CharacterType } from './entities/characters/Player1';
import { Vector } from '@engine/core';

export type { CharacterType };

export interface CharacterDefinition {
  type: CharacterType;
  name: string;
  createInstance: (position: Vector) => Character;
}

export const AVAILABLE_CHARACTERS: CharacterDefinition[] = [
  {
    type: 'PinkStar',
    name: 'Pink Star',
    createInstance: (position: Vector) => new Player1(position, 'PinkStar'),
  },
  {
    type: 'Crabby',
    name: 'Crabby',
    createInstance: (position: Vector) => new Player1(position, 'Crabby'),
  },
  {
    type: 'FierceTooth',
    name: 'Fierce Tooth',
    createInstance: (position: Vector) => new Player1(position, 'FierceTooth'),
  },
];

export default class CharacterSelectionManager {
  private static instance: CharacterSelectionManager;
  private selectedCharacterType: CharacterType = 'PinkStar';

  private constructor() {
    // Load from localStorage if available
    const saved = localStorage.getItem('selectedCharacter');
    if (saved && this.isValidCharacterType(saved)) {
      this.selectedCharacterType = saved as CharacterType;
    }
  }

  static getInstance(): CharacterSelectionManager {
    if (!CharacterSelectionManager.instance) {
      CharacterSelectionManager.instance = new CharacterSelectionManager();
    }
    return CharacterSelectionManager.instance;
  }

  getSelectedCharacterType(): CharacterType {
    return this.selectedCharacterType;
  }

  getSelectedCharacterDefinition(): CharacterDefinition {
    return AVAILABLE_CHARACTERS.find(
      char => char.type === this.selectedCharacterType
    )!;
  }

  setSelectedCharacterType(type: CharacterType): void {
    this.selectedCharacterType = type;
    localStorage.setItem('selectedCharacter', type);
  }

  createSelectedCharacter(position: Vector): Character {
    const definition = this.getSelectedCharacterDefinition();
    return definition.createInstance(position);
  }

  private isValidCharacterType(type: string): boolean {
    return AVAILABLE_CHARACTERS.some(char => char.type === type);
  }
}
