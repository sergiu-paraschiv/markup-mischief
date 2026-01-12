import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import type { DeviceInfo } from '@engine/utils';
import { Text, Layout9Slice, SpriteButton } from '@game/entities';

const TILE_INDEXES = {
  topLeft: 14,
  topCenter: 15,
  topRight: 16,
  middleLeft: 23,
  middleCenter: 24,
  middleRight: 25,
  bottomLeft: 32,
  bottomCenter: 33,
  bottomRight: 34,
};

export default class PlayerSwitchButton extends SpriteButton {
  private textComponent: Text;

  constructor(initialPosition: Vector, size: Vector, textComponent: Text) {
    // Scale up buttons on mobile devices for better touch targets
    const deviceInfo = GlobalContext.get<DeviceInfo>('deviceInfo');
    if (deviceInfo?.isMobile) {
      textComponent.scale = new Vector(1.7, 1.7);
    }

    const assets = GlobalContext.get<AssetsMap>('assets');

    // Primary/Secondary variants - with background
    const tilemap =
      assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'];

    const tiles = TILE_INDEXES;

    const hoverBackground = new Layout9Slice(
      size,
      tilemap.get(tiles.topLeft),
      tilemap.get(tiles.topCenter),
      tilemap.get(tiles.topRight),
      tilemap.get(tiles.middleLeft),
      tilemap.get(tiles.middleCenter),
      tilemap.get(tiles.middleRight),
      tilemap.get(tiles.bottomLeft),
      tilemap.get(tiles.bottomCenter),
      tilemap.get(tiles.bottomRight)
    );
    hoverBackground.fillColor = 'rgba(0, 0, 0, 0.1)';

    super(initialPosition, undefined, undefined, hoverBackground);

    this.textComponent = textComponent;

    this.buttonElement.addEventListener('keydown', event =>
      event.preventDefault()
    );
  }

  override get width() {
    return this.hoverBackground?.width || 0;
  }

  override get height() {
    return this.hoverBackground?.height || 0;
  }
}
