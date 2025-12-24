import { Vector, Element } from '@engine/core';
import { TickEvent } from '@engine/renderer';
import { Texture } from '@engine/loaders';
import Node2D from './Node2D';

export interface AnimationFrame {
  texture: Texture;
  duration: number;
}

export enum AnimationDirection {
  Forward = 0,
  Reverse = 1,
  PingPong = 2,
  PingPongReverse = 3,
}

export enum AnimationRepeat {
  Default = 0,
  Once = 1,
  Twice = 2,
  Fixed = 3,
}

export interface Animation {
  duration: number;
  frames: AnimationFrame[];
  direction: AnimationDirection;
  repeat: AnimationRepeat;
  repeatTimes: number;
}

export default class AnimatedSprite extends Node2D {
  private _meta: object | undefined;
  public flipH = false;
  public flipV = false;
  private _frames: AnimationFrame[] = [];
  private frameIndex: number;
  private animationRepeatIndex: number;
  private stopped = false;
  private previousTime: number;

  constructor(
    private _animation: Animation,
    position?: Vector,
    children: Element[] = []
  ) {
    super(position, children);

    this.frameIndex = 0;
    this.previousTime = 0;

    this._frames = _animation.frames;
    if (_animation.direction === AnimationDirection.Reverse) {
      this._frames = this._frames.reverse();
    }
    // TODO: handle AnimationDirection.PingPong and AnimationDirection.PingPongReverse

    this.animationRepeatIndex = _animation.repeatTimes;

    this.on(TickEvent, this.onTick.bind(this));
  }

  get animation() {
    return this._animation;
  }

  static empty() {
    return new AnimatedSprite({
      duration: 0,
      frames: [],
      direction: AnimationDirection.Forward,
      repeat: AnimationRepeat.Default,
      repeatTimes: 0,
    });
  }

  private onTick(event: TickEvent) {
    if (this.stopped) {
      return;
    }

    if (this.previousTime === 0) {
      this.previousTime = event.currentTime;
    }

    let deltaTime = event.currentTime - this.previousTime;
    let currentFrame = this._frames[this.frameIndex];
    if (!currentFrame) {
      return;
    }

    let advancedFrames = 0;

    while (deltaTime >= currentFrame.duration) {
      deltaTime -= currentFrame.duration;
      this.advanceFrame();
      currentFrame = this._frames[this.frameIndex];

      advancedFrames += 1;

      if (advancedFrames > 10) {
        deltaTime = 0;
      }
    }

    if (advancedFrames > 0) {
      this.previousTime = event.currentTime;
    }
  }

  play() {
    this.stopped = false;

    if (this._animation.repeat === AnimationRepeat.Default) {
      this.frameIndex = 0;
    } else if (this._animation.repeat === AnimationRepeat.Fixed) {
      this.frameIndex = 0;
      this.animationRepeatIndex = this._animation.repeatTimes;
    }
  }

  stop() {
    this.stopped = true;
    this.previousTime = 0;
  }

  private advanceFrame() {
    this.frameIndex += 1;
    if (this.frameIndex >= this._frames.length) {
      if (this._animation.repeat === AnimationRepeat.Default) {
        this.frameIndex = 0;
      } else if (this._animation.repeat === AnimationRepeat.Fixed) {
        this.frameIndex = 0;
        this.animationRepeatIndex -= 1;
        if (this.animationRepeatIndex === 0) {
          this.stop();
          return;
        }
      }
      // TODO: handle AnimationRepeat.Once and AnimationReapeat.Twice
      else {
        this.stop();
        return;
      }
    }
  }

  override draw(context: CanvasRenderingContext2D) {
    if (this._frames.length > this.frameIndex) {
      const texture = this._frames[this.frameIndex].texture;

      if (this.flipH || this.flipV) {
        const scaleX = this.flipH ? -1 : 1;
        const scaleY = this.flipV ? -1 : 1;
        context.save();
        context.scale(scaleX, scaleY);
        context.drawImage(
          texture.data,
          scaleX * Math.floor(this.position.x),
          Math.floor(this.position.y),
          scaleX * texture.width,
          texture.height
        );
        context.restore();
      } else {
        context.drawImage(
          texture.data,
          Math.floor(this.position.x),
          Math.floor(this.position.y)
        );
      }
    }
  }

  override get width() {
    return this._frames[0].texture.width;
  }

  override get height() {
    return this._frames[0].texture.height;
  }

  get animationDuration() {
    return this._animation.duration;
  }

  withMeta(meta: object | undefined) {
    this._meta = meta;
  }

  getMeta() {
    return this._meta;
  }
}
