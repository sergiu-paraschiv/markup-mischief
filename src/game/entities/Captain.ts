import { Vector } from '@engine/core';
import { Aseprite } from '@engine/loaders';
import { AnimatedSprite, Node2D } from '@engine/elements';
import {
  MouseButton,
  MouseInputEvent,
  KeyboardInputEvent,
  InputState,
  MouseButtonAction,
  KeyAction,
} from '@engine/input';
import { TickEvent } from '@engine/events';

enum Input {
  UP = 0,
  DOWN = 1,
  RESET = 2,
}

export default class Captain extends Node2D {
  constructor(private initialPosition: Vector) {
    super(initialPosition.clone());

    (async () => {
      const captainAseprite = await Aseprite.load(
        '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite'
      );
      captainAseprite.ignoreLayers(['Grid']);

      this.addChild(
        new AnimatedSprite(await captainAseprite.getAnimation('Run S'))
      );
    })();

    const input = new InputState(this);
    input
      .setOn(Input.UP)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.DOWN &&
          event.button === MouseButton.LEFT,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.DOWN && event.key === 'ArrowDown',
      });
    input
      .setOff(Input.UP)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.UP &&
          event.button === MouseButton.LEFT,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.UP && event.key === 'ArrowDown',
      });

    input
      .setOn(Input.DOWN)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.DOWN &&
          event.button === MouseButton.RIGHT,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.DOWN && event.key === 'ArrowUp',
      });

    input
      .setOff(Input.DOWN)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.UP &&
          event.button === MouseButton.RIGHT,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.UP && event.key === 'ArrowUp',
      });

    input
      .setOn(Input.RESET)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.DOWN &&
          event.button === MouseButton.WHEEL,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.DOWN &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight'),
      });

    input
      .setOff(Input.RESET)
      .when({
        type: MouseInputEvent,
        condition: event =>
          event.action === MouseButtonAction.UP &&
          event.button === MouseButton.WHEEL,
      })
      .when({
        type: KeyboardInputEvent,
        condition: event =>
          event.action === KeyAction.UP &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight'),
      });

    this.on(TickEvent, () => {
      if (input.state.get(Input.UP)) {
        this.position.y += 1;
      }

      if (input.state.get(Input.DOWN)) {
        this.position.y -= 1;
      }

      if (input.state.get(Input.RESET)) {
        this.position.y = this.initialPosition.y;
      }
    });
  }
}
