import { Element, Event, EventEmitter } from '@engine/core';
import InputMapper, { MappedInputEvent, Output } from './InputMapper';

enum State {
  On = 'on',
  Off = 'off',
}

type StateProps = Map<Output, boolean>;

class StateChangeEvent extends Event {}

export default class InputState extends EventEmitter {
  private inputMapper: InputMapper;
  private _state: StateProps = new Map();

  constructor(element: Element) {
    super();

    this.inputMapper = new InputMapper(element);
    this.inputMapper.on(MappedInputEvent, (event) => {
      const newState = event.meta === State.On;
      if (newState !== this._state.get(event.type)) {
        this._state.set(event.type, newState);
        this.dispatchEvent(new StateChangeEvent());
      }
    });
  }

  setOn(prop: Output) {
    return this.inputMapper.trigger(prop, State.On);
  }

  setOff(prop: Output) {
    return this.inputMapper.trigger(prop, State.Off);
  }

  onChange(handler: (state: StateProps) => void) {
    this.on(StateChangeEvent, () => {
      handler(this._state);
    });
  }

  get state() {
    return this._state;
  }
}
