import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { Node2D, Sprite } from '@engine/elements';
import {
  MouseInteractionManager,
  MouseEnterEvent,
  MouseLeaveEvent,
  MouseClickEvent,
} from '@engine/input';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

type ActionFn = () => void;

export default class Button extends Node2D {
  private background: Layout3Slice | Sprite;
  public readonly mouseInteraction: MouseInteractionManager;
  public action: ActionFn | undefined = undefined;

  constructor(initialPosition: Vector, textComponent: Text) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');

    if (textComponent.children.length > 1) {
      this.background = new Layout3Slice(
        textComponent.width + 12,
        assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(2),
        assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(3),
        assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(4)
      );
      textComponent.position = new Vector(6, 4);
    } else {
      this.background = new Sprite(
        assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(1)
      );
      textComponent.position = new Vector(5, 4);
    }

    this.addChild(this.background);

    this.addChild(textComponent);

    // Set up mouse interaction
    this.mouseInteraction = new MouseInteractionManager(this);

    // Example: Add hover effect
    this.mouseInteraction.on(MouseEnterEvent, this.handleMouseEnter.bind(this));
    this.mouseInteraction.on(MouseLeaveEvent, this.handleMouseLeave.bind(this));
    this.mouseInteraction.on(MouseClickEvent, this.handleMouseClick.bind(this));
  }

  private handleMouseEnter(): void {
    this.opacity = 0.8;
  }

  private handleMouseLeave(): void {
    this.opacity = 1.0;
  }

  private handleMouseClick(): void {
    if (this.action) {
      this.action();
    }
  }

  override get width() {
    return this.background.width;
  }

  override get height() {
    return this.background.height;
  }
}
