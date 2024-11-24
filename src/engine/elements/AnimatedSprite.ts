import { Vector, Element } from '@engine/core';
import { TickEvent } from '@engine/events';
import { Texture } from '@engine/loaders';
import Sprite from './Sprite';

export type AnimationFrame = {
  texture: Texture;
  duration: number;
};

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

export type Animation = {
  frames: AnimationFrame[];
  direction: AnimationDirection;
  repeat: AnimationRepeat;
  repeatTimes: number;
};

export default class AnimatedSprite extends Element {
  private _frames: AnimationFrame[] = [];
  private frameIndex: number;
  private animationRepeatIndex: number;
  private stopped = false;
  private previousTime: number;

  constructor(private animation: Animation, position?: Vector, children: Element[] = []) {
    super([new Sprite(undefined, position), ...children]);

    this.frameIndex = 0;
    this.previousTime = 0;

    this._frames = animation.frames;
    if (animation.direction === AnimationDirection.Reverse) {
      this._frames = this._frames.reverse();
    }
    // TODO: handle AnimationDirection.PingPong and AnimationDirection.PingPongReverse

    this.animationRepeatIndex = animation.repeatTimes;

    this.updateSprite();

    this.on(TickEvent, this.onTick.bind(this));
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
      this.updateSprite();
    }
  }

  play() {
    this.stopped = false;

    if (this.animation.repeat === AnimationRepeat.Default) {
      this.frameIndex = 0;
    } else if (this.animation.repeat === AnimationRepeat.Fixed) {
      this.frameIndex = 0;
      this.animationRepeatIndex = this.animation.repeatTimes;
    }
  }

  stop() {
    this.stopped = true;
    this.previousTime = 0;
  }

  private advanceFrame() {
    this.frameIndex += 1;
    if (this.frameIndex >= this._frames.length) {
      if (this.animation.repeat === AnimationRepeat.Default) {
        this.frameIndex = 0;
      } else if (this.animation.repeat === AnimationRepeat.Fixed) {
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

  private updateSprite() {
    if (this._frames.length > this.frameIndex) {
      (this.children[0] as Sprite).texture = this._frames[this.frameIndex].texture;
    }
  }
}
