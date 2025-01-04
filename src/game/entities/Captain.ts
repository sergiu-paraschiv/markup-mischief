import { Vector } from '@engine/core';
import { AnimatedSprite, Node2D } from '@engine/elements';
import CharacterController from './CharacterController';
import { Assets } from '@game';

enum Stance {
  IDLE = 'Captain Clown Nose Idle',
  JUMPING = 'Captain Clown Nose Jump',
  FALLING = 'Captain Clown Nose Fall',
  GROUND = 'Captain Clown Nose Ground',
  RUNNING = 'Captain Clown Nose Run',
}

enum Pointing {
  LEFT = 0,
  RIGHT = 1,
}

export default class Captain extends CharacterController {
  private readonly gfx: Node2D;
  private activeStance: Stance | undefined;
  private activeStanceStartTime = 0;
  private pointing = Pointing.RIGHT;

  constructor(initialPosition: Vector) {
    super(initialPosition);

    this.gfx = new Node2D();
    this.addChild(this.gfx);
    this.setColliderOffset(new Vector(8, 4));
    this.setColliderDimensions(new Vector(16, 28));
    this.switchStance(0);
  }

  protected override switchStance(currentTime: number) {
    let newStance = Stance.IDLE;

    if (this.avgVelocity.y > 1) {
      newStance = Stance.FALLING;
    } else if (this.avgVelocity.y < -1) {
      newStance = Stance.JUMPING;
    }

    if (this.avgVelocity.x > 1) {
      this.pointing = Pointing.RIGHT;
    } else if (this.avgVelocity.x < -1) {
      this.pointing = Pointing.LEFT;
    }

    const activeStanceDuration = currentTime - this.activeStanceStartTime;

    if (this.activeStance === Stance.FALLING && newStance === Stance.IDLE) {
      newStance = Stance.GROUND;
    } else if (
      this.activeStance === Stance.GROUND &&
      activeStanceDuration <= Assets.animation[Stance.GROUND].duration
    ) {
      newStance = Stance.GROUND;
    }

    if (
      newStance !== Stance.GROUND &&
      Math.abs(this.avgVelocity.y) < 1 &&
      Math.abs(this.avgVelocity.x) > 1
    ) {
      newStance = Stance.RUNNING;
    }

    if (newStance !== this.activeStance) {
      this.activeStanceStartTime = currentTime;
      this.activeStance = newStance;

      this.gfx.removeAllChildren();
      this.gfx.addChild(new AnimatedSprite(Assets.animation[newStance]));
    }

    if (this.gfx.children.length === 1) {
      const sp = this.gfx?.children[0] as AnimatedSprite;
      sp.flipH = this.pointing === Pointing.LEFT;
      if (sp.flipH) {
        sp.translation = new Vector(-40, -32);
      } else {
        sp.translation = new Vector(-22, -32);
      }
    }
  }
}
