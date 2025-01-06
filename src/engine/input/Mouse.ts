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

export default class Mouse extends InputDevice {
  constructor(
    container: HTMLElement,
    private readonly getLocalPoint: (point: Vector) => Vector
  ) {
    super();

    // container.addEventListener('contextmenu', event => {
    //   event.preventDefault();
    // });

    container.addEventListener('mousedown', this.eventHandler.bind(this));
    container.addEventListener('mouseup', this.eventHandler.bind(this));
  }

  private eventHandler(event: MouseEvent) {
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
}
