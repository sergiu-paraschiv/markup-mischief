import { Vector } from '@engine/core';
import InputEvent from './InputEvent';
import InputDevice from './InputDevice';

export enum MouseButton {
  LEFT = 0,
  RIGHT = 2,
  WHEEL = 1,
}
const BUTTONS = [0, 2, 1];

export enum MouseButtonAction {
  DOWN = 0,
  UP = 1,
}

export class MouseInputEvent extends InputEvent {
  constructor(
    public readonly button: MouseButton,
    public readonly action: MouseButtonAction,
    public readonly point: Vector
  ) {
    super();
  }
}

export class MouseMoveEvent extends InputEvent {
  constructor(public readonly point: Vector) {
    super();
  }
}

export default class Mouse extends InputDevice {
  private static lastPosition: Vector | null = null;

  static getLastPosition(): Vector | null {
    return Mouse.lastPosition;
  }

  constructor(
    container: HTMLElement,
    private readonly getLocalPoint: (point: Vector) => Vector
  ) {
    super();

    // container.addEventListener('contextmenu', event => {
    //   event.preventDefault();
    // });

    container.addEventListener('mousedown', this.inputEventHandler.bind(this));
    container.addEventListener('mouseup', this.inputEventHandler.bind(this));
    container.addEventListener('mousemove', this.moveEventHandler.bind(this));
  }

  private inputEventHandler(event: MouseEvent) {
    for (const buttonIndex of BUTTONS) {
      if (event.button === buttonIndex) {
        this.dispatchEvent(
          new MouseInputEvent(
            buttonIndex,
            event.type === 'mousedown'
              ? MouseButtonAction.DOWN
              : MouseButtonAction.UP,
            this.getLocalPoint(new Vector(event.x, event.y))
          )
        );
      }
    }
  }

  private moveEventHandler(event: MouseEvent) {
    const localPoint = this.getLocalPoint(new Vector(event.x, event.y));
    Mouse.lastPosition = localPoint;
    this.dispatchEvent(new MouseMoveEvent(localPoint));
  }
}
