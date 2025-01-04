import { Vector } from '@engine/core';
import { KeyboardInputEvent, InputState, KeyAction } from '@engine/input';
import { DynamicBody, PhysicsTickEvent } from '@engine/physics';
import AfterPhysicsTickEvent from 'engine/physics/AfterPhysicsTickEvent';

enum Input {
  UP = 0,
  LEFT = 1,
  RIGHT = 2,
}

export default class CharacterController extends DynamicBody {
  constructor(initialPosition: Vector) {
    super(initialPosition);

    // this.setMaxVelocity(new Vector(96, 0));

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

    let jumping = false;
    input.onChange(newState => {
      if (newState.get(Input.UP) && this.isGrounded()) {
        jumping = true;
      }
    });

    this.on(
      PhysicsTickEvent,
      e => {
        if (!(input.state.get(Input.LEFT) && input.state.get(Input.RIGHT))) {
          if (input.state.get(Input.LEFT)) {
            this.applyImpulse(new Vector(-16, 0), e.deltaTime);
          }
          if (input.state.get(Input.RIGHT)) {
            this.applyImpulse(new Vector(16, 0), e.deltaTime);
          }
        }

        if (jumping) {
          jumping = false;
          this.applyImpulse(new Vector(0, -32 * 9));
        }
      },
      true
    );

    this.on(
      AfterPhysicsTickEvent,
      e => {
        this.switchStance(e.currentTime);
      },
      true
    );
  }

  protected switchStance(currentTime: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    currentTime;
  }
}
