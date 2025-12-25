import Element from './Element';
import EventEmitter from './EventEmitter';

export enum EventPhase {
  CAPTURING,
  TARGETING,
}

export default class Event {
  private _phase = EventPhase.CAPTURING;
  private _propagationStopped = false;
  private _target: Element | null | undefined;
  private _source: EventEmitter | null = null;

  public stopPropagation(): void {
    this._propagationStopped = true;
    this.destroy();
  }

  public get propagationStopped() {
    return this._propagationStopped;
  }

  public get target(): Element | null | undefined {
    return this._target;
  }

  public set target(newTarget: Element | null) {
    if (this._target !== undefined) {
      throw new Error('Event target already set!');
    }

    this._target = newTarget;
    this._phase = EventPhase.CAPTURING;
  }

  public get source(): EventEmitter | null {
    return this._source;
  }

  public set source(newSource: EventEmitter | null) {
    if (this._source !== null) {
      throw new Error('Event source already set!');
    }

    this._source = newSource;
  }

  public get phase() {
    return this._phase;
  }

  public capture() {
    this._phase = EventPhase.TARGETING;
  }

  public destroy() {
    this._target = null;
    this._source = null;
  }
}
