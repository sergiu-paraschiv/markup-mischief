import Character from './Character';
import { Vector } from '@engine/core';

export default class PinkStar extends Character {
  constructor(initialPosition: Vector) {
    super(initialPosition, 'The Crusty Crew Pink Star');
  }
}
