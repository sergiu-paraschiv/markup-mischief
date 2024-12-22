import { Element, EventEmitter } from '@engine/core';
import InputEvent from './InputEvent';

interface InputMapTrigger<T extends InputEvent> {
  type: new (...args: never[]) => T;
  condition: (event: T) => boolean;
}

export type Output = string | number;

export class MappedInputEvent extends InputEvent {
  constructor(
    public type: Output,
    public meta?: string | number | object
  ) {
    super();
  }
}

export default class InputMapper extends EventEmitter {
  constructor(private element: Element) {
    super();
  }

  trigger(output: Output, meta?: string | number | object) {
    const whenThis = {
      when: <T extends InputEvent>(trigger: InputMapTrigger<T>) => {
        this.element.on(
          trigger.type,
          event => {
            if (trigger.condition(event)) {
              this.handleEvent(new MappedInputEvent(output, meta));
            }
          },
          true
        );

        return whenThis;
      },
    };

    return whenThis;
  }
}
