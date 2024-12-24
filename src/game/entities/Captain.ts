import { Vector } from '@engine/core';
import { Aseprite } from '@engine/loaders';
import { AnimatedSprite, Node2D } from '@engine/elements';
import { KeyboardInputEvent, InputState, KeyAction } from '@engine/input';
import { PhysicsBody, PhysicsTickEvent } from '@engine/physics';
import { PhysicsBodyType } from 'engine/physics/PhysicsBody';

enum Input {
  UP = 0,
  LEFT = 1,
  RIGHT = 2,
}

enum Stance {
  IDLE = 0,
  JUMPING = 1,
  FALLING = 2,
  GROUND = 3,
  RUNNING = 4,
}

enum Pointing {
  LEFT = 0,
  RIGHT = 1,
}

export default class Captain extends Node2D {
  private body: PhysicsBody | undefined;
  private gfx: Node2D | undefined;
  private activeStance: Stance | undefined;
  private activeStanceStartTime = 0;
  private stances: Record<Stance, AnimatedSprite> = {
    [Stance.IDLE]: AnimatedSprite.empty(),
    [Stance.JUMPING]: AnimatedSprite.empty(),
    [Stance.FALLING]: AnimatedSprite.empty(),
    [Stance.GROUND]: AnimatedSprite.empty(),
    [Stance.RUNNING]: AnimatedSprite.empty(),
  };
  private pointing = Pointing.RIGHT;
  private linVelAcc: Vector[] = [
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 0),
  ];

  constructor(initialPosition: Vector) {
    super();

    const body = new PhysicsBody(
      initialPosition.clone(),
      PhysicsBodyType.CHARACTER
    );
    body.setColliderDimensions(new Vector(32, 32));

    (async () => {
      const captainAseprite = await Aseprite.load(
        '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite'
      );
      captainAseprite.ignoreLayers(['Grid']);

      this.stances[Stance.IDLE] = new AnimatedSprite(
        await captainAseprite.getAnimation('Idle')
      );

      this.stances[Stance.JUMPING] = new AnimatedSprite(
        await captainAseprite.getAnimation('Jump')
      );

      this.stances[Stance.FALLING] = new AnimatedSprite(
        await captainAseprite.getAnimation('Fall')
      );

      this.stances[Stance.GROUND] = new AnimatedSprite(
        await captainAseprite.getAnimation('Ground')
      );

      this.stances[Stance.RUNNING] = new AnimatedSprite(
        await captainAseprite.getAnimation('Run')
      );

      this.gfx = new Node2D();

      body.addChild(this.gfx);
      this.addChild(body);
      this.body = body;

      this.body.setMaxImpulse(new Vector(4, 0.1));
      this.switchStance(0);
    })();

    const input = new InputState(this);
    input.setOn(Input.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowUp',
    });
    input.setOff(Input.UP).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowUp',
    });

    input.setOn(Input.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowLeft',
    });
    input.setOff(Input.LEFT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowLeft',
    });

    input.setOn(Input.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.DOWN && event.key === 'ArrowRight',
    });
    input.setOff(Input.RIGHT).when({
      type: KeyboardInputEvent,
      condition: event =>
        event.action === KeyAction.UP && event.key === 'ArrowRight',
    });

    input.onChange(newState => {
      if (newState.get(Input.UP)) {
        this.body?.applyImpulse(new Vector(0, 34));
      }
    });

    this.on(
      PhysicsTickEvent,
      event => {
        if (!(input.state.get(Input.LEFT) && input.state.get(Input.RIGHT))) {
          if (input.state.get(Input.LEFT)) {
            this.body?.applyImpulse(new Vector(-1, 0));
          }
          if (input.state.get(Input.RIGHT)) {
            this.body?.applyImpulse(new Vector(1, 0));
          }
        }

        this.switchStance(event.currentTime);
        if (this.body) {
          this.linVelAcc.shift();
          this.linVelAcc.push(this.body.getLinVel());
        }
      },
      true
    );
  }

  private switchStance(currentTime: number) {
    let newStance = Stance.IDLE;
    const linVel = this.getLinVel();

    if (linVel.y < -1) {
      newStance = Stance.FALLING;
    } else if (linVel.y > 1) {
      newStance = Stance.JUMPING;
    } else if (Math.abs(linVel.x) > 1) {
      newStance = Stance.RUNNING;
    }

    if (linVel.x > 0.1) {
      this.pointing = Pointing.RIGHT;
    } else if (linVel.x < -0.1) {
      this.pointing = Pointing.LEFT;
    }

    const activeStanceDuration = currentTime - this.activeStanceStartTime;

    if (this.activeStance === Stance.FALLING && newStance === Stance.IDLE) {
      newStance = Stance.GROUND;
    } else if (
      this.activeStance === Stance.GROUND &&
      activeStanceDuration <= this.stances[Stance.GROUND].animationDuration
    ) {
      newStance = Stance.GROUND;
    }

    if (newStance !== this.activeStance) {
      this.activeStanceStartTime = currentTime;
      this.activeStance = newStance;

      this.gfx?.removeAllChildren();
      this.gfx?.addChild(this.stances[newStance]);
    }

    if (this.gfx?.children.length === 1) {
      const sp = this.gfx?.children[0] as AnimatedSprite;
      sp.flipH = this.pointing === Pointing.LEFT;
      if (sp.flipH) {
        sp.translation = new Vector(-40, -32);
      } else {
        sp.translation = new Vector(-22, -32);
      }
    }
  }

  private getLinVel(): Vector {
    let x = 0;
    let y = 0;
    for (const linVel of this.linVelAcc) {
      x += linVel.x;
      y += linVel.y;
    }

    x = x / this.linVelAcc.length;
    y = y / this.linVelAcc.length;

    return new Vector(x, y);
  }
}
