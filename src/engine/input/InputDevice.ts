import { Element, EventEmitter, Event } from '@engine/core';

export default class InputDevice extends EventEmitter {
  private rootElement: Element | undefined;

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  override dispatchEvent(event: Event): void {
    this.rootElement?.dispatchEvent(event);
  }
}
