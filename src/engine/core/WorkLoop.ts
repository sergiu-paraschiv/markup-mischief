type WorkFn = (currentTime: number) => void;

export default class WorkLoop {
  private maxFps: number;
  private fpsInterval: number;
  private startTime: number;
  private previousTime: number;

  constructor(private readonly workFn: WorkFn) {
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

  private workLoop(currentTime: number) {
    if (this.startTime === 0) {
      this.startTime = currentTime;
    }

    const deltaTime = currentTime - this.previousTime;
    if (deltaTime >= this.fpsInterval) {
      this.previousTime = currentTime - (deltaTime % this.fpsInterval);

      this.workFn(currentTime);
    }

    requestAnimationFrame(this.workLoop.bind(this));
  }

  private computeFpsInterval() {
    return 1000 / this.maxFps;
  }
}
