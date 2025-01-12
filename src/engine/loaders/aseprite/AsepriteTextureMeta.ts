export interface AsepriteTextureMetaData {
  asset: string;
  tileset: string;
  tileId: number;
}

export default class AsepriteTextureMeta {
  constructor(
    public readonly asset: string,
    public readonly tileset: string,
    public readonly tileId: number
  ) {}

  toObject(): AsepriteTextureMetaData {
    return {
      asset: this.asset,
      tileset: this.tileset,
      tileId: this.tileId,
    };
  }
}
