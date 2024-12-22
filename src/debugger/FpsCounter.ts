export default class FpsCounter {
  private frameCount: number;
  private startTime: number;
  private currentFps: number;

  constructor() {
    this.frameCount = 0;
    this.startTime = 0;
    this.currentFps = 0;
  }

  advance(currentTime: number) {
    if (this.startTime === 0) {
      this.startTime = currentTime;
    }

    const sinceStart = currentTime - this.startTime;

    this.frameCount += 1;
    this.currentFps =
      Math.round((1000 / (sinceStart / this.frameCount)) * 100) / 100;

    // average FPS over the last 10 seconds only
    if (sinceStart >= 10000) {
      this.startTime = currentTime;
      this.frameCount = 0;
    }
  }

  get fps() {
    return this.currentFps;
  }
}
