import { Vector } from '@engine/core';
import { Node2D } from '@engine/elements';

export type TouchControlCallback = (key: string, pressed: boolean) => void;

interface ControlButton {
  key: string;
  label: string;
  element: HTMLButtonElement;
}

/**
 * TouchControls - On-screen virtual buttons for mobile devices
 * Creates DOM buttons that trigger keyboard-like input events
 */
export default class TouchControls extends Node2D {
  private container: HTMLDivElement;
  private buttons: ControlButton[] = [];
  private onControlCallback: TouchControlCallback;

  constructor(position: Vector, onControl: TouchControlCallback) {
    super(position);
    this.onControlCallback = onControl;

    // Create container for all touch controls
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.left = '0';
    this.container.style.right = '0';
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'space-between';
    this.container.style.padding = '0 20px';
    this.container.style.pointerEvents = 'none'; // Allow clicks to pass through
    this.container.style.zIndex = '2000';
    this.container.style.gap = '10px';
    this.container.setAttribute('data-interactive', 'true');

    this.attachedDOM = this.container;

    // Create button groups
    this.createButtonGroups();
  }

  private createButtonGroups(): void {
    // Left side - D-Pad (Arrow keys)
    const dpadGroup = this.createButtonGroup();
    dpadGroup.style.display = 'grid';
    dpadGroup.style.gridTemplateColumns = 'repeat(3, 60px)';
    dpadGroup.style.gridTemplateRows = 'repeat(3, 60px)';
    dpadGroup.style.gap = '5px';

    // D-Pad layout:
    //     [↑]
    // [←] [↓] [→]

    const upBtn = this.createButton('ArrowUp', '↑');
    upBtn.style.gridColumn = '2';
    upBtn.style.gridRow = '1';
    dpadGroup.appendChild(upBtn);

    const leftBtn = this.createButton('ArrowLeft', '←');
    leftBtn.style.gridColumn = '1';
    leftBtn.style.gridRow = '2';
    dpadGroup.appendChild(leftBtn);

    const downBtn = this.createButton('ArrowDown', '↓');
    downBtn.style.gridColumn = '2';
    downBtn.style.gridRow = '2';
    dpadGroup.appendChild(downBtn);

    const rightBtn = this.createButton('ArrowRight', '→');
    rightBtn.style.gridColumn = '3';
    rightBtn.style.gridRow = '2';
    dpadGroup.appendChild(rightBtn);

    this.container.appendChild(dpadGroup);

    // Right side - Action button (Space)
    const actionGroup = this.createButtonGroup();
    const spaceBtn = this.createButton(' ', 'GRAB');
    spaceBtn.style.width = '80px';
    spaceBtn.style.height = '80px';
    spaceBtn.style.fontSize = '14px';
    actionGroup.appendChild(spaceBtn);
    this.container.appendChild(actionGroup);
  }

  private createButtonGroup(): HTMLDivElement {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.alignItems = 'center';
    return group;
  }

  private createButton(key: string, label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.setAttribute('data-interactive', 'true');

    // Styling
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.fontSize = '24px';
    button.style.fontWeight = 'bold';
    button.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    button.style.borderRadius = '8px';
    button.style.background = 'rgba(0, 0, 0, 0.6)';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.userSelect = 'none';
    button.style.touchAction = 'none';
    button.style.pointerEvents = 'auto'; // Re-enable pointer events for buttons
    button.style.transition = 'all 0.1s';

    // Prevent default behaviors
    button.addEventListener('contextmenu', e => e.preventDefault());
    button.addEventListener('dragstart', e => e.preventDefault());

    // Touch event handlers
    const handlePress = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      button.style.background = 'rgba(100, 150, 255, 0.8)';
      button.style.transform = 'scale(0.95)';
      this.onControlCallback(key, true);
    };

    const handleRelease = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      button.style.background = 'rgba(0, 0, 0, 0.6)';
      button.style.transform = 'scale(1)';
      this.onControlCallback(key, false);
    };

    // Support both touch and mouse events
    button.addEventListener('touchstart', handlePress, { passive: false });
    button.addEventListener('touchend', handleRelease, { passive: false });
    button.addEventListener('touchcancel', handleRelease, { passive: false });
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('mouseup', handleRelease);
    button.addEventListener('mouseleave', handleRelease);

    // Store button reference
    this.buttons.push({ key, label, element: button });

    return button;
  }

  /**
   * Show the touch controls
   */
  show(): void {
    this.container.style.display = 'flex';
  }

  /**
   * Hide the touch controls
   */
  hide(): void {
    this.container.style.display = 'none';
  }
}
