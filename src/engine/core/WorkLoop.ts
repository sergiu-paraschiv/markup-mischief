type WorkFn = (currentTime: number, deltaTime: number) => void;

export default class WorkLoop {
  private maxFps: number;
  private fpsInterval: number;
  private startTime: number;
  private previousTime: number;

  constructor(
    private readonly workFn: WorkFn,
    private readonly recouperateLostTime = true
  ) {
    this.maxFps = 10;
    this.fpsInterval = this.computeFpsInterval();
    this.startTime = 0;
    this.previousTime = 0;
  }

  start(maxFps: number): void {
    this.maxFps = maxFps;
    this.fpsInterval = this.computeFpsInterval();
    this.previousTime = 0;
    this.startTime = 0;

    requestAnimationFrame(this.workLoop.bind(this));
  }

  get expectedDeltaT() {
    return this.fpsInterval;
  }

  private workLoop(currentTime: number) {
    if (this.startTime === 0) {
      this.startTime = currentTime;
    }

    const deltaTime = currentTime - this.previousTime;
    if (deltaTime >= this.fpsInterval) {
      this.previousTime = currentTime;
      if (this.recouperateLostTime) {
        this.previousTime -= deltaTime % this.fpsInterval;
      }

      this.workFn(currentTime, deltaTime);
    }

    requestAnimationFrame(this.workLoop.bind(this));
  }

  private computeFpsInterval() {
    return 1000 / this.maxFps;
  }
}
