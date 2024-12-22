import Element from './Element';

export enum EventPhase {
  CAPTURING,
  TARGETING,
  BUBBLING,
}

export default class Event {
  private _phase = EventPhase.CAPTURING;
  private _propagationStopped = false;
  private _target: Element | null | undefined;

  public stopPropagation(): void {
    this._propagationStopped = true;
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

  public get phase() {
    return this._phase;
  }

  public capture() {
    this._phase = EventPhase.TARGETING;
  }

  public bubble() {
    this._phase = EventPhase.BUBBLING;
  }

  public destroy() {
    this._target = null;
  }
}
