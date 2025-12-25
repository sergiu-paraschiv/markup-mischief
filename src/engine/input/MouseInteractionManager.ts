import { EventEmitter, Event, Vector } from '@engine/core';
import { Node2D } from '@engine/elements';
import { MouseInputEvent, MouseMoveEvent, MouseButtonAction } from './Mouse';
import {
  MouseEnterEvent,
  MouseLeaveEvent,
  MouseClickEvent,
} from './MouseInteractionEvent';

export default class MouseInteractionManager extends EventEmitter {
  private isHovered = false;

  constructor(private readonly _target: Node2D) {
    super();
    this.setupListeners();
  }

  get target(): Node2D {
    return this._target;
  }

  private setupListeners(): void {
    // Listen to mouse move events from the root
    this.target.rootElement.on(MouseMoveEvent, this.handleMouseMove.bind(this));

    // Listen to mouse button events from the root
    this.target.rootElement.on(
      MouseInputEvent,
      this.handleMouseInput.bind(this)
    );
  }

  private handleMouseMove(event: Event): void {
    if (!(event instanceof MouseMoveEvent)) return;

    const isIntersecting = this.isPointInBounds(event.point);

    // Handle enter/leave state changes
    if (isIntersecting && !this.isHovered) {
      this.isHovered = true;
      this.handleEvent(new MouseEnterEvent(event.point));
    } else if (!isIntersecting && this.isHovered) {
      this.isHovered = false;
      this.handleEvent(new MouseLeaveEvent(event.point));
    }
  }

  private handleMouseInput(event: Event): void {
    if (!(event instanceof MouseInputEvent)) return;

    // Only dispatch click on mouse UP when hovering
    if (event.action === MouseButtonAction.UP && this.isHovered) {
      this.handleEvent(new MouseClickEvent(event.button, event.point));
    }
  }

  private isPointInBounds(point: Vector): boolean {
    const pos = this.target.position;
    const width = this.target.width;
    const height = this.target.height;

    return (
      point.x >= pos.x &&
      point.x <= pos.x + width &&
      point.y >= pos.y &&
      point.y <= pos.y + height
    );
  }

  public destroy(): void {
    // Clean up event listeners
    this.target.rootElement.off(
      MouseMoveEvent,
      this.handleMouseMove.bind(this)
    );
    this.target.rootElement.off(
      MouseInputEvent,
      this.handleMouseInput.bind(this)
    );
  }
}
