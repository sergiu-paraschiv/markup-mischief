import Vector from '../core/Vector';
import Element from '../core/Element';
import TickEvent from '../events/TickEvent';
import Texture from '../loaders/Texture';
import Sprite from './Sprite';

export type Frame = {
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
  frames: Frame[];
  direction: AnimationDirection;
  repeat: AnimationRepeat;
  repeatTimes: number;
};

export default class AnimatedSprite extends Element {
  private _frames: Frame[] = [];
  private frameIndex: number;
  private elapsedTimeAccumulator: number;
  private animationRepeatIndex: number;
  private stopped = false;

  constructor(
    private animation: Animation,
    position?: Vector,
    children: Element[] = []
  ) {
    super([new Sprite(undefined, position), ...children]);

    this.frameIndex = 0;
    this.elapsedTimeAccumulator = 0;

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
    this.elapsedTimeAccumulator += event.elapsedTime;
    if (this.stopped) {
      return;
    }

    let currentFrame = this._frames[this.frameIndex];
    if (!currentFrame) {
      this.frameIndex = 0;
      this.updateSprite();
      return;
    }

    while (this.elapsedTimeAccumulator > currentFrame.duration) {
      this.frameIndex += 1;
      this.elapsedTimeAccumulator -= currentFrame.duration;

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

      currentFrame = this._frames[this.frameIndex];
    }

    this.updateSprite();
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
  }

  private updateSprite() {
    if (this._frames.length > this.frameIndex) {
      (this.children[0] as Sprite).texture =
        this._frames[this.frameIndex].texture;
    }
  }
}
