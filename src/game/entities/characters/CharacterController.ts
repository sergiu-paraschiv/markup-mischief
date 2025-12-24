import { Vector, Event } from '@engine/core';
import { KeyboardInputEvent, InputState, KeyAction } from '@engine/input';
import { DynamicBody, PhysicsTickEvent } from '@engine/physics';
import AfterPhysicsTickEvent from 'engine/physics/AfterPhysicsTickEvent';

export enum CharacterInput {
  UP = 0,
  LEFT = 1,
  RIGHT = 2,
  DROP = 3,
  GRAB = 4,
}

export class CharacterDropEvent extends Event {
  constructor(public readonly start: boolean) {
    super();
  }
}

export class CharacterGrabEvent extends Event {}

export default class CharacterController extends DynamicBody {
  protected input: InputState;

  constructor(initialPosition: Vector) {
    super(initialPosition);

    // this.setMaxVelocity(new Vector(96, 0));

    this.input = new InputState(this);
    this.input.setOn(CharacterInput.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowUp',
    });
    this.input.setOff(CharacterInput.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowUp',
    });

    this.input.setOn(CharacterInput.DROP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowDown',
    });
    this.input.setOff(CharacterInput.DROP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowDown',
    });

    this.input.setOn(CharacterInput.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowLeft',
    });
    this.input.setOff(CharacterInput.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowLeft',
    });

    this.input.setOn(CharacterInput.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowRight',
    });
    this.input.setOff(CharacterInput.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowRight',
    });

    this.input.setOn(CharacterInput.GRAB).when({
      type: KeyboardInputEvent,
      condition: event => event.action === KeyAction.DOWN && event.key === ' ',
    });
    this.input.setOff(CharacterInput.GRAB).when({
      type: KeyboardInputEvent,
      condition: event => event.action === KeyAction.UP && event.key === ' ',
    });

    let jumping = false;
    let dropping = false;
    this.input.onChange(newState => {
      if (newState.get(CharacterInput.UP) && this.isGrounded()) {
        jumping = true;
      }

      if (newState.get(CharacterInput.DROP) && this.isGrounded()) {
        dropping = true;
        this.dispatchEvent(new CharacterDropEvent(true));
      } else if (dropping) {
        dropping = false;
        this.dispatchEvent(new CharacterDropEvent(false));
      }

      if (newState.get(CharacterInput.GRAB) && this.isGrounded()) {
        this.dispatchEvent(new CharacterGrabEvent());
      }
    });

    this.on(PhysicsTickEvent, e => {
      if (
        !(
          this.input.state.get(CharacterInput.LEFT) &&
          this.input.state.get(CharacterInput.RIGHT)
        )
      ) {
        if (this.input.state.get(CharacterInput.LEFT)) {
          this.applyImpulse(new Vector(-16, 0), e.deltaTime);
        }
        if (this.input.state.get(CharacterInput.RIGHT)) {
          this.applyImpulse(new Vector(16, 0), e.deltaTime);
        }
      }

      if (jumping) {
        jumping = false;
        this.applyImpulse(new Vector(0, -32 * 9), e.deltaTime);
      }

      if (dropping) {
        this.applyImpulse(new Vector(0, 3), e.deltaTime);
      }
    });

    this.on(AfterPhysicsTickEvent, e => {
      this.switchStance(e.currentTime);
    });
  }

  protected switchStance(currentTime: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    currentTime;
  }
}
