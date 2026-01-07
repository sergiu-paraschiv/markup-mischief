import InputDevice from './InputDevice';
import { KeyboardInputEvent, KeyAction } from './Keyboard';

/**
 * TouchButton - A virtual button that emulates keyboard input events
 * Used for on-screen touch controls on mobile devices
 */
export default class TouchButton extends InputDevice {
  /**
   * Simulates a key press
   * @param key The key to simulate (e.g., 'ArrowLeft', ' ', 'w')
   */
  pressKey(key: string): void {
    this.dispatchEvent(new KeyboardInputEvent(key, KeyAction.DOWN));
  }

  /**
   * Simulates a key release
   * @param key The key to simulate
   */
  releaseKey(key: string): void {
    this.dispatchEvent(new KeyboardInputEvent(key, KeyAction.UP));
  }
}
