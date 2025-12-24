export interface AsepriteAnimationMetaData {
  asset: string;
  animationName: string;
}

export default class AsepriteAnimationMeta {
  constructor(
    public readonly asset: string,
    public readonly animationName: string
  ) {}

  toObject(): AsepriteAnimationMetaData {
    return {
      asset: this.asset,
      animationName: this.animationName,
    };
  }
}
