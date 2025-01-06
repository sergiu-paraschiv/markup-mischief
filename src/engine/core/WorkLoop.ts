type WorkFn = (currentTime: number, deltaTime: number) => void;

export default class WorkLoop {
  private maxFps: number;
  private fpsInterval: number;
  private previousTime: number;
  private stopRequested: boolean;

  constructor(private readonly workFn: WorkFn) {
    this.maxFps = 10;
    this.fpsInterval = this.computeFpsInterval();
    this.previousTime = 0;
    this.stopRequested = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopRequested = true;
      } else {
        this.start(this.maxFps);
      }
    });
  }

  start(maxFps: number): void {
    this.maxFps = maxFps;
    this.fpsInterval = this.computeFpsInterval();
    this.previousTime = 0;
    this.stopRequested = false;

    requestAnimationFrame(this.workLoop.bind(this));
  }

  get expectedDeltaT() {
    return this.fpsInterval;
  }

  private workLoop(currentTime: number) {
    if (this.stopRequested) {
      return;
    }

    if (this.previousTime === 0) {
      this.previousTime = currentTime;
    }

    const deltaTime = currentTime - this.previousTime;
    if (deltaTime >= this.fpsInterval) {
      this.previousTime = currentTime;
      this.workFn(currentTime, deltaTime);
    }

    requestAnimationFrame(this.workLoop.bind(this));
  }

  private computeFpsInterval() {
    return 1000 / this.maxFps;
  }
}
