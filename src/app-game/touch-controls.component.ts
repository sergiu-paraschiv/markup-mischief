import { Component, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';

/**
 * TouchControls Angular Component
 * On-screen virtual buttons for mobile devices
 * Renders outside the canvas as pure DOM elements
 */
@Component({
  selector: 'app-touch-controls',
  standalone: true,
  template: `
    <div class="touch-controls-container" [class.visible]="isVisible">
      <div class="button-group dpad">
        <button class="touch-btn up" data-key="ArrowUp" data-interactive="true">
          ↑
        </button>
        <button
          class="touch-btn left"
          data-key="ArrowLeft"
          data-interactive="true">
          ←
        </button>
        <button
          class="touch-btn down"
          data-key="ArrowDown"
          data-interactive="true">
          ↓
        </button>
        <button
          class="touch-btn right"
          data-key="ArrowRight"
          data-interactive="true">
          →
        </button>
      </div>
      <div class="button-group action">
        <button class="touch-btn grab" data-key=" " data-interactive="true">
          GRAB
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .touch-controls-container {
        position: fixed;
        bottom: 20px;
        left: 0;
        right: 0;
        display: none;
        justify-content: space-between;
        padding: 0 20px;
        pointer-events: none;
        z-index: 2000;
        gap: 10px;
      }

      .touch-controls-container.visible {
        display: flex;
      }

      .button-group {
        display: flex;
        align-items: center;
        pointer-events: none;
      }

      .button-group.dpad {
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(2, 60px);
        gap: 5px;
      }

      .button-group.action {
        display: flex;
        align-items: center;
      }

      .touch-btn {
        width: 60px;
        height: 60px;
        font-size: 24px;
        font-weight: bold;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        cursor: pointer;
        user-select: none;
        touch-action: none;
        pointer-events: auto;
        transition: all 0.1s;
      }

      .touch-btn.up {
        grid-column: 2;
        grid-row: 1;
      }

      .touch-btn.left {
        grid-column: 1;
        grid-row: 2;
      }

      .touch-btn.down {
        grid-column: 2;
        grid-row: 2;
      }

      .touch-btn.right {
        grid-column: 3;
        grid-row: 2;
      }

      .touch-btn.grab {
        width: 80px;
        height: 80px;
        font-size: 14px;
      }

      .touch-btn:active,
      .touch-btn.pressed {
        background: rgba(100, 150, 255, 0.8);
        transform: scale(0.95);
      }
    `,
  ],
})
export class TouchControlsComponent implements OnDestroy {
  isVisible = false;
  private buttons: HTMLButtonElement[] = [];
  private isInitialized = false;
  private onControlCallback?: (key: string, pressed: boolean) => void;
  private eventListeners = new Map<
    HTMLButtonElement,
    {
      touchstart: (e: Event) => void;
      touchend: (e: Event) => void;
      touchcancel: (e: Event) => void;
      mousedown: (e: Event) => void;
      mouseup: (e: Event) => void;
      mouseleave: (e: Event) => void;
      contextmenu: (e: Event) => void;
      dragstart: (e: Event) => void;
    }
  >();

  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Set the callback to be called when buttons are pressed/released
   */
  setCallback(callback: (key: string, pressed: boolean) => void): void {
    this.onControlCallback = callback;
  }

  private ensureInitialized(): void {
    if (this.isInitialized) return;
    this.setupButtons();
    this.isInitialized = true;
  }

  private setupButtons(): void {
    const container = this.elementRef.nativeElement.querySelector(
      '.touch-controls-container'
    );
    if (!container) return;

    this.buttons = Array.from(container.querySelectorAll('.touch-btn'));

    this.buttons.forEach(button => {
      const key = button.getAttribute('data-key');
      if (!key) return;

      const handlePress = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        button.classList.add('pressed');
        this.onControlCallback?.(key, true);
      };

      const handleRelease = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        button.classList.remove('pressed');
        this.onControlCallback?.(key, false);
      };

      const preventDefault = (e: Event) => e.preventDefault();

      const listeners = {
        touchstart: handlePress,
        touchend: handleRelease,
        touchcancel: handleRelease,
        mousedown: handlePress,
        mouseup: handleRelease,
        mouseleave: handleRelease,
        contextmenu: preventDefault,
        dragstart: preventDefault,
      };

      this.eventListeners.set(button, listeners);

      // Add event listeners
      button.addEventListener('touchstart', listeners.touchstart, {
        passive: false,
      });
      button.addEventListener('touchend', listeners.touchend, {
        passive: false,
      });
      button.addEventListener('touchcancel', listeners.touchcancel, {
        passive: false,
      });
      button.addEventListener('mousedown', listeners.mousedown);
      button.addEventListener('mouseup', listeners.mouseup);
      button.addEventListener('mouseleave', listeners.mouseleave);
      button.addEventListener('contextmenu', listeners.contextmenu);
      button.addEventListener('dragstart', listeners.dragstart);
    });
  }

  private cleanup(): void {
    this.buttons.forEach(button => {
      const listeners = this.eventListeners.get(button);
      if (!listeners) return;

      button.removeEventListener('touchstart', listeners.touchstart);
      button.removeEventListener('touchend', listeners.touchend);
      button.removeEventListener('touchcancel', listeners.touchcancel);
      button.removeEventListener('mousedown', listeners.mousedown);
      button.removeEventListener('mouseup', listeners.mouseup);
      button.removeEventListener('mouseleave', listeners.mouseleave);
      button.removeEventListener('contextmenu', listeners.contextmenu);
      button.removeEventListener('dragstart', listeners.dragstart);
    });

    this.eventListeners.clear();
    this.buttons = [];
  }

  /**
   * Show the touch controls
   */
  show(): void {
    this.ensureInitialized();
    this.isVisible = true;
    this.cdr.markForCheck();
  }

  /**
   * Hide the touch controls
   */
  hide(): void {
    this.isVisible = false;
    this.cdr.markForCheck();
  }
}
