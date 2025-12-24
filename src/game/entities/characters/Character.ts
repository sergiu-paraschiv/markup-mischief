import { Vector, GlobalContext } from '@engine/core';
import { AnimatedSprite, Node2D } from '@engine/elements';
import CharacterController from './CharacterController';
import { AssetsMap } from '@engine/loaders';

enum Stance {
  IDLE = 'Idle',
  JUMPING = 'Jump',
  FALLING = 'Fall',
  GROUND = 'Ground',
  RUNNING = 'Run',
}

export enum Pointing {
  LEFT = 0,
  RIGHT = 1,
}

export default class Character extends CharacterController {
  private readonly gfx: Node2D;
  private activeStance: Stance | undefined;
  private activeStanceStartTime = 0;
  private _pointing = Pointing.RIGHT;

  constructor(
    initialPosition: Vector,
    private assetName: string,
    private spritePointing: Pointing = Pointing.LEFT,
    private spriteOffset = new Vector(0, 0)
  ) {
    super(initialPosition);

    this.gfx = new Node2D();
    this.addChild(this.gfx);
    this.setColliderOffset(new Vector(38, 4));
    this.setColliderDimensions(new Vector(20, 28));
    this.switchStance(0);
    this._pointing = Pointing.RIGHT;
  }

  get pointing() {
    return this._pointing;
  }

  get pointingDefault() {
    return this._pointing === this.spritePointing;
  }

  protected override switchStance(currentTime: number) {
    const assets = GlobalContext.get<AssetsMap>('assets');

    let newStance = Stance.IDLE;

    const velocity = this.avgVelocity();

    if (velocity.y > 0.1) {
      newStance = Stance.FALLING;
    } else if (velocity.y < -0.1) {
      newStance = Stance.JUMPING;
    }

    if (velocity.x > 0.1) {
      this._pointing = Pointing.RIGHT;
    } else if (velocity.x < -0.1) {
      this._pointing = Pointing.LEFT;
    }

    const activeStanceDuration = currentTime - this.activeStanceStartTime;

    if (this.activeStance === Stance.FALLING && newStance === Stance.IDLE) {
      newStance = Stance.GROUND;
    } else if (
      this.activeStance === Stance.GROUND &&
      activeStanceDuration <=
        assets[this.assetName].animations[Stance.GROUND].duration
    ) {
      newStance = Stance.GROUND;
    }

    if (
      newStance !== Stance.GROUND &&
      Math.abs(velocity.y) < 0.1 &&
      Math.abs(velocity.x) > 0.1
    ) {
      newStance = Stance.RUNNING;
    }

    if (newStance !== this.activeStance) {
      this.activeStanceStartTime = currentTime;
      this.activeStance = newStance;

      this.gfx.removeAllChildren();
      this.gfx.addChild(
        new AnimatedSprite(assets[this.assetName].animations[newStance])
      );
    }

    if (this.gfx.children.length === 1) {
      const sp = this.gfx?.children[0] as AnimatedSprite;
      sp.flipH = this._pointing !== this.spritePointing;
      if (sp.flipH) {
        sp.translation = new Vector(0, -32).add(this.spriteOffset);
      } else {
        sp.translation = new Vector(0, -32).sub(this.spriteOffset);
      }
    }
  }
}
