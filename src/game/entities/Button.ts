import { Vector, GlobalContext, Event } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import { Node2D } from '@engine/elements';
import {
  MouseInteractionManager,
  MouseEnterEvent,
  MouseLeaveEvent,
  MouseClickEvent,
  CursorManager,
} from '@engine/input';
import Text from './Text';
import Layout3Slice from './Layout3Slice';

export default class Button extends Node2D {
  private background: Layout3Slice;
  public readonly mouseInteraction: MouseInteractionManager;

  constructor(
    initialPosition: Vector,
    public readonly text: string
  ) {
    super(initialPosition);
    const assets = GlobalContext.get<AssetsMap>('assets');

    const ts = new Text(text);

    this.background = new Layout3Slice(
      ts.width + 12,
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(2),
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(3),
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'].get(4)
    );

    this.addChild(this.background);

    ts.position = new Vector(6, 4);

    this.addChild(ts);

    // Set up mouse interaction
    this.mouseInteraction = new MouseInteractionManager(this);

    // Example: Add hover effect
    this.mouseInteraction.on(MouseEnterEvent, this.handleMouseEnter.bind(this));
    this.mouseInteraction.on(MouseLeaveEvent, this.handleMouseLeave.bind(this));
    this.mouseInteraction.on(MouseClickEvent, this.handleMouseClick.bind(this));
  }

  private handleMouseEnter(event: Event): void {
    if (!(event instanceof MouseEnterEvent)) return;
    // Visual feedback for hover - slightly increase opacity
    this.opacity = 0.8;

    // Change cursor to pointer
    const cursorManager = GlobalContext.get<CursorManager>('cursorManager');
    cursorManager.setCursor('pointer');
  }

  private handleMouseLeave(event: Event): void {
    if (!(event instanceof MouseLeaveEvent)) return;
    // Reset opacity
    this.opacity = 1.0;

    // Reset cursor to default
    const cursorManager = GlobalContext.get<CursorManager>('cursorManager');
    cursorManager.setCursor('default');
  }

  private handleMouseClick(event: Event): void {
    if (!(event instanceof MouseClickEvent)) return;
    console.log(`Button "${this.text}" clicked!`);
  }

  override get width() {
    return this.background.width;
  }

  override get height() {
    return this.background.height;
  }
}
