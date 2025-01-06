export default class TileSelectEvent {
  constructor(
    public readonly asset: string,
    public readonly tileset: string,
    public readonly tileId: number
  ) {}
}
