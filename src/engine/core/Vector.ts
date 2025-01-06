export default class Vector {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  public get width() {
    return this.x;
  }

  public set width(newX: number) {
    this.x = newX;
  }

  public get left() {
    return this.x;
  }

  public get height() {
    return this.y;
  }

  public set height(newY: number) {
    this.y = newY;
  }

  public get top() {
    return this.y;
  }

  add(otherVector: Vector): Vector {
    return new Vector(this.x + otherVector.x, this.y + otherVector.y);
  }

  sub(otherVector: Vector): Vector {
    return this.add(otherVector.mul(-1));
  }

  mul(a: number): Vector {
    return new Vector(this.x * a, this.y * a);
  }

  div(a: number): Vector {
    return this.mul(1 / a);
  }

  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  public get normal() {
    return new Vector(normal(this.x), normal(this.y));
  }
}

function normal(n: number) {
  if (n > 0) {
    return 1;
  } else if (n < 0) {
    return -1;
  }
  return 0;
}
