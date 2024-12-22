import InputEvent from './InputEvent';
import InputDevice from './InputDevice';

export enum KeyAction {
  DOWN = 0,
  UP = 1,
}

export class KeyboardInputEvent extends InputEvent {
  constructor(
    public readonly key: string,
    public readonly action: KeyAction
  ) {
    super();
  }
}

export default class Keyboard extends InputDevice {
  constructor(container: HTMLElement) {
    super();

    container.addEventListener('keydown', this.eventHandler.bind(this));
    container.addEventListener('keyup', this.eventHandler.bind(this));
  }

  private eventHandler(event: KeyboardEvent) {
    event.preventDefault();

    this.dispatchEvent(
      new KeyboardInputEvent(
        event.key,
        event.type === 'keydown' ? KeyAction.DOWN : KeyAction.UP
      )
    );
  }
}
