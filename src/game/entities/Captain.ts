import { Vector } from '@engine/core';
import { Aseprite } from '@engine/loaders';
import { AnimatedSprite, Node2D } from '@engine/elements';
import { KeyboardInputEvent, InputState, KeyAction } from '@engine/input';
import { PhysicsBody, PhysicsTickEvent } from '@engine/physics';
import { PhysicsBodyType } from 'engine/physics/PhysicsBody';

enum Input {
  UP = 0,
  LEFT = 1,
  RIGHT = 2,
}

export default class Captain extends Node2D {
  private body: PhysicsBody | undefined;
  constructor(initialPosition: Vector) {
    super();

    const body = new PhysicsBody(
      initialPosition.clone(),
      PhysicsBodyType.CHARACTER
    );
    body.setColliderDimensions(new Vector(32, 32));

    (async () => {
      const captainAseprite = await Aseprite.load(
        '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite'
      );
      captainAseprite.ignoreLayers(['Grid']);

      const gfx = new AnimatedSprite(
        await captainAseprite.getAnimation('Run S')
      );

      gfx.translation = new Vector(-22, -32);

      body.addChild(gfx);
      this.addChild(body);
      this.body = body;
    })();

    const input = new InputState(this);
    input.setOn(Input.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowUp',
    });
    input.setOff(Input.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowUp',
    });

    input.setOn(Input.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowLeft',
    });
    input.setOff(Input.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowLeft',
    });

    input.setOn(Input.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowRight',
    });
    input.setOff(Input.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowRight',
    });

    input.onChange(newState => {
      if (newState.get(Input.UP)) {
        this.body?.applyImpulse(new Vector(0, 34));
      }
    });

    this.on(
      PhysicsTickEvent,
      () => {
        if (!(input.state.get(Input.LEFT) && input.state.get(Input.RIGHT))) {
          if (input.state.get(Input.LEFT)) {
            this.body?.applyImpulse(new Vector(-1, 0));
          }
          if (input.state.get(Input.RIGHT)) {
            this.body?.applyImpulse(new Vector(1, 0));
          }
        }
      },
      true
    );
  }
}
