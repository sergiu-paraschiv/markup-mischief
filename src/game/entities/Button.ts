import { Vector, GlobalContext } from '@engine/core';
import { AssetsMap } from '@engine/loaders';
import type { DeviceInfo } from '@engine/utils';
import Text from './Text';
import Layout3Slice from './Layout3Slice';
import Layout9Slice from './Layout9Slice';
import SpriteButton from './SpriteButton';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

const OUTLINE_DEFAULT = 'rgba(0, 0, 0, 0.3)';
const TEXT_DISABLED = 'rgba(128, 128, 128, 0.5)';

const TILE_INDEXES = {
  primary: {
    regular: {
      topLeft: 14,
      topCenter: 15,
      topRight: 16,
      middleLeft: 23,
      middleCenter: 24,
      middleRight: 25,
      bottomLeft: 32,
      bottomCenter: 33,
      bottomRight: 34,
    },
    hover: {
      topLeft: 52,
      topCenter: 53,
      topRight: 54,
      middleLeft: 23,
      middleCenter: 24,
      middleRight: 25,
      bottomLeft: 60,
      bottomCenter: 61,
      bottomRight: 62,
    },
  },
  secondary: {
    regular: {
      topLeft: 18,
      topCenter: 19,
      topRight: 20,
      middleLeft: 27,
      middleCenter: 28,
      middleRight: 29,
      bottomLeft: 36,
      bottomCenter: 37,
      bottomRight: 38,
    },
    hover: {
      topLeft: 56,
      topCenter: 57,
      topRight: 58,
      middleLeft: 27,
      middleCenter: 28,
      middleRight: 29,
      bottomLeft: 64,
      bottomCenter: 65,
      bottomRight: 66,
    },
  },
};

export default class Button extends SpriteButton {
  private textDefaultPosition: Vector;
  private textComponent: Text;
  private variant: ButtonVariant;
  private underline: Layout3Slice | undefined;

  constructor(
    initialPosition: Vector,
    textComponent: Text,
    variant: ButtonVariant = 'primary'
  ) {
    textComponent.position = new Vector(0, -1);
    textComponent.padding = new Vector(6, 6);

    // Scale up buttons on mobile devices for better touch targets
    const deviceInfo = GlobalContext.get<DeviceInfo>('deviceInfo');
    if (deviceInfo?.isMobile) {
      textComponent.scale = new Vector(1.7, 1.7);
    }

    const assets = GlobalContext.get<AssetsMap>('assets');

    // Text variant - no background, just text with underline on hover
    if (variant === 'text') {
      const tilemap = assets['Chars'].tilemaps['Chars'];

      super(initialPosition, undefined, undefined, undefined);

      this.addChild(textComponent);

      // Create underline using 3-slice (tiles 282, 283, 284)
      this.underline = new Layout3Slice(
        textComponent.width,
        tilemap.get(90),
        tilemap.get(90),
        tilemap.get(90)
      );
      this.underline.position = new Vector(
        0,
        textComponent.height - textComponent.padding.y + 1
      );
      this.underline.isVisible = false;
      this.addChild(this.underline);
    } else {
      // Primary/Secondary variants - with background
      const tilemap =
        assets['Wood and Paper UI - Buttons'].tilemaps['Wood and Paper'];

      const outlineThicknessX = 1;
      const outlineThicknessY = 1;

      const tiles = TILE_INDEXES[variant];

      const backgroundSize = textComponent.size;
      // Create backgrounds first to get dimensions

      const outline = new Layout9Slice(
        backgroundSize.add(
          new Vector(outlineThicknessX * 2, outlineThicknessY * 2)
        ),
        tilemap.get(tiles.regular.topLeft),
        tilemap.get(tiles.regular.topCenter),
        tilemap.get(tiles.regular.topRight),
        tilemap.get(tiles.regular.middleLeft),
        tilemap.get(tiles.regular.middleCenter),
        tilemap.get(tiles.regular.middleRight),
        tilemap.get(tiles.regular.bottomLeft),
        tilemap.get(tiles.regular.bottomCenter),
        tilemap.get(tiles.regular.bottomRight)
      );

      const background = new Layout9Slice(
        backgroundSize,
        tilemap.get(tiles.regular.topLeft),
        tilemap.get(tiles.regular.topCenter),
        tilemap.get(tiles.regular.topRight),
        tilemap.get(tiles.regular.middleLeft),
        tilemap.get(tiles.regular.middleCenter),
        tilemap.get(tiles.regular.middleRight),
        tilemap.get(tiles.regular.bottomLeft),
        tilemap.get(tiles.regular.bottomCenter),
        tilemap.get(tiles.regular.bottomRight)
      );

      const hoverBackground = new Layout9Slice(
        backgroundSize,
        tilemap.get(tiles.hover.topLeft),
        tilemap.get(tiles.hover.topCenter),
        tilemap.get(tiles.hover.topRight),
        tilemap.get(tiles.hover.middleLeft),
        tilemap.get(tiles.hover.middleCenter),
        tilemap.get(tiles.hover.middleRight),
        tilemap.get(tiles.hover.bottomLeft),
        tilemap.get(tiles.hover.bottomCenter),
        tilemap.get(tiles.hover.bottomRight)
      );

      super(initialPosition, outline, background, hoverBackground);

      this.addChild(textComponent);

      // Position outline with desired thickness
      outline.position = new Vector(-outlineThicknessX, -outlineThicknessY);
      outline.fillColor = OUTLINE_DEFAULT;

      // Scale outline to achieve desired vertical thickness
      const scaleY =
        (background.height + outlineThicknessY * 2) / outline.height;
      outline.scale = new Vector(1, scaleY);
    }

    this.textComponent = textComponent;
    this.textDefaultPosition = this.textComponent.position;
    this.variant = variant;
  }

  protected override updateVisualState(): void {
    super.updateVisualState();

    if (this._isDisabled) {
      if (this.underline) {
        this.underline.isVisible = false;
      }
      this.textComponent.position = this.textDefaultPosition;
      this.textComponent.fillColor = TEXT_DISABLED;
      return;
    }

    // Reset text color when not disabled
    this.textComponent.fillColor = undefined;

    const isActive = this._isFocused || this._isHovered;

    if (this.variant === 'text') {
      // Text variant: show underline on hover/focus
      if (this.underline) {
        this.underline.isVisible = isActive;
      }
      this.textComponent.position = this.textDefaultPosition;
    } else {
      // Primary/Secondary variants: move text down and swap background
      if (isActive) {
        this.textComponent.position = new Vector(
          this.textDefaultPosition.x,
          this.textDefaultPosition.y + 1
        );
      } else {
        this.textComponent.position = this.textDefaultPosition;
      }
    }
  }

  override get width() {
    return this.background?.width || this.textComponent?.width || 0;
  }

  override get height() {
    return this.background?.height || this.textComponent?.height || 0;
  }
}
