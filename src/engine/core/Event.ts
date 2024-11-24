export default class Event {
  private _propagationStopped = false;

  public stopPropagation(): void {
    this._propagationStopped = true;
  }

  public get propagationStopped() {
    return this._propagationStopped;
  }
}
