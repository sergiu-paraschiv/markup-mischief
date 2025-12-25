import { Vector } from '@engine/core';
import InputEvent from './InputEvent';
import { MouseButton } from './Mouse';

export class MouseEnterEvent extends InputEvent {
  constructor(public readonly point: Vector) {
    super();
  }
}

export class MouseLeaveEvent extends InputEvent {
  constructor(public readonly point: Vector) {
    super();
  }
}

export class MouseClickEvent extends InputEvent {
  constructor(
    public readonly button: MouseButton,
    public readonly point: Vector
  ) {
    super();
  }
}
