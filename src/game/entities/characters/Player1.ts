import Character from './Character';
import { Vector } from '@engine/core';

export type CharacterType = 'PinkStar' | 'Crabby' | 'FierceTooth';

export const CHARACTER_ASSET_MAP: Record<CharacterType, string> = {
  PinkStar: 'The Crusty Crew Pink Star',
  Crabby: 'The Crusty Crew Crabby',
  FierceTooth: 'The Crusty Crew Fierce Tooth',
};

export default class Player1 extends Character {
  constructor(initialPosition: Vector, characterType: CharacterType) {
    super(initialPosition, CHARACTER_ASSET_MAP[characterType]);
    this.setCharacterType(characterType);
  }

  setCharacterType(characterType: CharacterType) {
    this.assetName = CHARACTER_ASSET_MAP[characterType];
    if (characterType === 'Crabby') {
      this.setColliderDimensions(new Vector(40, 28));
    } else {
      this.setColliderDimensions(new Vector(20, 28));
    }
    this.switchStance(0, true);
  }
}
