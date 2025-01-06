import { Vector } from '@engine/core';
import { AnimatedSprite, Node2D } from '@engine/elements';
import { Assets } from '@game';
import CharacterController from './CharacterController';

enum Stance {
  IDLE = 'Idle',
  JUMPING = 'Jump',
  FALLING = 'Fall',
  GROUND = 'Ground',
  RUNNING = 'Run',
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

    const velocity = this.avgVelocity();

    if (velocity.y > 1) {
      newStance = Stance.FALLING;
    } else if (velocity.y < -1) {
      newStance = Stance.JUMPING;
    }

    if (velocity.x > 1) {
      this.pointing = Pointing.RIGHT;
    } else if (velocity.x < -1) {
      this.pointing = Pointing.LEFT;
    }

    const activeStanceDuration = currentTime - this.activeStanceStartTime;

    if (this.activeStance === Stance.FALLING && newStance === Stance.IDLE) {
      newStance = Stance.GROUND;
    } else if (
      this.activeStance === Stance.GROUND &&
      activeStanceDuration <=
        Assets.aseprite['Captain Clown Nose'].animations[Stance.GROUND].duration
    ) {
      newStance = Stance.GROUND;
    }

    if (
      newStance !== Stance.GROUND &&
      Math.abs(velocity.y) < 1 &&
      Math.abs(velocity.x) > 1
    ) {
      newStance = Stance.RUNNING;
    }

    if (newStance !== this.activeStance) {
      this.activeStanceStartTime = currentTime;
      this.activeStance = newStance;

      this.gfx.removeAllChildren();
      this.gfx.addChild(
        new AnimatedSprite(
          Assets.aseprite['Captain Clown Nose'].animations[newStance]
        )
      );
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
