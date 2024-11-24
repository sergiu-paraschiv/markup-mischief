export default class Vector {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  add(otherVector: Vector): Vector {
    return new Vector(this.x + otherVector.x, this.y + otherVector.y);
  }

  clone(): Vector {
    return new Vector(this.x, this.y);
  }
}
