export type CursorStyle =
  | 'default'
  | 'pointer'
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'text';

export default class CursorManager {
  private canvas: HTMLCanvasElement;
  private currentCursor: CursorStyle = 'default';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setCursor(style: CursorStyle): void {
    if (this.currentCursor !== style) {
      this.currentCursor = style;
      this.canvas.style.cursor = style;
    }
  }

  getCursor(): CursorStyle {
    return this.currentCursor;
  }

  reset(): void {
    this.setCursor('default');
  }
}
