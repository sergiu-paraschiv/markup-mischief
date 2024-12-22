import { Element, EventEmitter, Event } from '@engine/core';

export default class InputDevice extends EventEmitter {
  private rootElement: Element | undefined;

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  dispatchEvent(event: Event): void {
    event.target = null;
    this.rootElement?.dispatchEvent(event);
  }
}
