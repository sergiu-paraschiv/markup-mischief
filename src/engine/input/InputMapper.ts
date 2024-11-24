import { Element, EventEmitter } from '@engine/core';
import { InputEvent } from '@engine/events';

type InputMapTrigger<T extends InputEvent> = {
  type: new (...args: any[]) => T;
  condition: (event: T) => boolean;
};

export type Output = string | number;

export class MappedInputEvent extends InputEvent {
  constructor(public type: Output, public meta?: any) {
    super();
  }
}

export default class InputMapper extends EventEmitter {
  constructor(private element: Element) {
    super();
  }

  trigger(output: Output, meta?: any) {
    const whenThis = {
      when: <T extends InputEvent>(trigger: InputMapTrigger<T>) => {
        this.element.on(trigger.type, (event) => {
          if (trigger.condition(event)) {
            this.dispatchEvent(new MappedInputEvent(output, meta));
          }
        });

        return whenThis;
      },
    };

    return whenThis;
  }
}
