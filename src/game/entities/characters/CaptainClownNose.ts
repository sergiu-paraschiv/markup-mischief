import Character, { Pointing } from './Character';
import { Vector } from '@engine/core';

export default class CaptainClownNose extends Character {
  constructor(initialPosition: Vector) {
    super(
      initialPosition,
      'Captain Clown Nose',
      Pointing.RIGHT,
      new Vector(-10, 0)
    );
  }
}
