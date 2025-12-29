import { GlobalContext, Vector } from '@engine/core';
import { AnimatedSprite, AnimationRepeat, Node2D } from '@engine/elements';
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
  private readonly dustGfx: Node2D;
  public readonly ghost: Node2D;
  private activeStance: Stance | undefined;
  private activeStanceStartTime = 0;
  private _pointing = Pointing.RIGHT;
  private dialogueAnimation: AnimatedSprite | undefined;

  constructor(
    initialPosition: Vector,
    protected assetName: string,
    private spritePointing: Pointing = Pointing.LEFT,
    private spriteOffset = new Vector(0, 0)
  ) {
    super(initialPosition);

    this.gfx = new Node2D();
    this.dustGfx = new Node2D();

    this.addChild(this.dustGfx);
    this.addChild(this.gfx);

    // Ghost is created but not added as child - it will be added to the scene separately
    this.ghost = new Node2D();
    this.ghost.isVisible = false;

    this.setColliderOffset(new Vector(0, 4));
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

  get ghostGraphics() {
    return this.ghost;
  }

  public updateGhostPosition() {
    this.ghost.position = this.position;
  }

  public setSpriteOffset(spriteOffset: Vector) {
    this.spriteOffset = spriteOffset;
  }

  protected override switchStance(currentTime: number, force = false) {
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

    if (newStance !== this.activeStance || force) {
      this.activeStanceStartTime = currentTime;
      this.activeStance = newStance;

      this.gfx.removeAllChildren();
      const sprite = new AnimatedSprite(
        assets[this.assetName].animations[newStance]
      );
      const translation = new Vector(
        -sprite.width / 2 + this.collider.dimensions.width / 2,
        0
      );
      this.gfx.translation = translation;
      this.ghost.translation = translation;

      this.ghost.removeAllChildren();

      const ghostSprite = new AnimatedSprite(
        assets[this.assetName].animations[newStance]
      );
      ghostSprite.opacity = 0.5;
      ghostSprite.fillColor = 'rgba(0, 0, 0, 1)';
      this.ghost.addChild(ghostSprite);

      this.gfx.addChild(sprite);

      this.dustGfx.removeAllChildren();
      // Add dust particles for running, jumping, and falling
      const dustAsset = assets['The Crusty Crew Dust Particles'];
      if (
        dustAsset &&
        (newStance === Stance.RUNNING ||
          newStance === Stance.JUMPING ||
          newStance === Stance.FALLING)
      ) {
        const dustAnimation = dustAsset.animations[newStance];
        if (dustAnimation) {
          const dustSprite = new AnimatedSprite(dustAnimation);
          // Position at the bottom center of the character
          dustSprite.translation = new Vector(
            -dustSprite.width / 2 + this.collider.dimensions.width / 2,
            32 - dustSprite.height
          );
          if (newStance === Stance.RUNNING) {
            dustSprite.animation.repeat = AnimationRepeat.Default;
          } else {
            dustSprite.animation.repeat = AnimationRepeat.Once;
          }
          this.dustGfx.addChild(dustSprite);
        }
      }
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

    if (this.dustGfx.children.length === 1) {
      const sp = this.dustGfx?.children[0] as AnimatedSprite;
      sp.flipH = this._pointing === Pointing.LEFT;
    }

    if (this.ghost.children.length === 1) {
      const ghostSp = this.ghost?.children[0] as AnimatedSprite;
      ghostSp.clipRegion = this.ghostGraphics.clipRegion;
      ghostSp.flipH = this._pointing !== this.spritePointing;
      if (ghostSp.flipH) {
        ghostSp.translation = new Vector(0, -32).add(this.spriteOffset);
      } else {
        ghostSp.translation = new Vector(0, -32).sub(this.spriteOffset);
      }
    }
  }

  public showExclamation() {
    const assets = GlobalContext.get<AssetsMap>('assets');
    const dialogueAsset = assets['The Crusty Crew Dialogue'];

    if (!dialogueAsset || !dialogueAsset.animations['Exclamation']) {
      throw new Error('Exclamation animation not found');
    }

    if (this.dialogueAnimation) {
      this.dialogueAnimation.remove();
    }

    this.dialogueAnimation = new AnimatedSprite(
      dialogueAsset.animations['Exclamation']
    );
    this.dialogueAnimation.translation = new Vector(
      this.colliderOffset.x +
        this.collider.dimensions.width / 2 -
        this.dialogueAnimation.width / 2,
      this.colliderOffset.y - 24
    );
    this.dialogueAnimation.animation.repeat = AnimationRepeat.Once;
    this.addChild(this.dialogueAnimation);
  }
}
