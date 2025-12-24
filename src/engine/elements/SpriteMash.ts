import { Element, GlobalContext, Vector } from '@engine/core';
import Sprite from './Sprite';
import AnimatedSprite from './AnimatedSprite';
import {
  AsepriteTextureMeta,
  AsepriteTextureMetaData,
  AsepriteAnimationMeta,
  AsepriteAnimationMetaData,
} from '@engine/loaders';

export enum SpriteMashItemType {
  Static = 'static',
  Animated = 'animated',
}

type SpriteMashItem =
  | {
      type: SpriteMashItemType.Static;
      position: { x: number; y: number };
      texture: AsepriteTextureMetaData;
    }
  | {
      type: SpriteMashItemType.Animated;
      position: { x: number; y: number };
      animation: AsepriteAnimationMetaData;
      animationSpeed?: number;
    };

export interface SpriteMashData {
  numLayers: number;
  layers: SpriteMashItem[][];
}

export default class SpriteMash extends Element {
  constructor(private _numLayers: number) {
    super();

    for (let i = 0; i < _numLayers; i += 1) {
      this.addChild(new Element());
    }
  }

  getLayer(index: number) {
    return this.children.at(index);
  }

  get numLayers() {
    return this._numLayers;
  }

  toObject(): SpriteMashData {
    const data: SpriteMashData = {
      numLayers: this._numLayers,
      layers: [],
    };

    for (let i = 0; i < this._numLayers; i += 1) {
      const layerItems: SpriteMashItem[] = [];

      for (const child of this.children[i].children) {
        if (child instanceof AnimatedSprite) {
          const animationMeta = child.getMeta();
          if (animationMeta instanceof AsepriteAnimationMeta) {
            layerItems.push({
              type: SpriteMashItemType.Animated,
              position: {
                x: child.position.x,
                y: child.position.y,
              },
              animation: animationMeta.toObject(),
              animationSpeed: child.animationSpeed,
            });
          }
        } else if (child instanceof Sprite) {
          const textureMeta = child.getMeta();
          if (textureMeta instanceof AsepriteTextureMeta) {
            layerItems.push({
              type: SpriteMashItemType.Static,
              position: {
                x: child.position.x,
                y: child.position.y,
              },
              texture: textureMeta.toObject(),
            });
          }
        }
      }

      data.layers.push(layerItems);
    }

    return data;
  }

  clear(newNumLayers: number) {
    this.removeAllChildren();
    this._numLayers = newNumLayers;

    for (let i = 0; i < this._numLayers; i += 1) {
      this.addChild(new Element());
    }
  }

  static fromData(data: SpriteMashData) {
    const sm = new SpriteMash(data.numLayers);
    const assets = GlobalContext.get('assets');

    for (let layerIndex = 0; layerIndex < data.layers.length; layerIndex += 1) {
      const items = data.layers[layerIndex];
      for (const item of items) {
        if (item.type === SpriteMashItemType.Animated) {
          const animation =
            assets[item.animation.asset].animations[
              item.animation.animationName
            ];
          const animatedSprite = new AnimatedSprite(
            animation,
            new Vector(item.position.x, item.position.y)
          );
          animatedSprite.animationSpeed = item.animationSpeed ?? 1.0;
          animatedSprite.withMeta(
            new AsepriteAnimationMeta(
              item.animation.asset,
              item.animation.animationName
            )
          );
          sm.getLayer(layerIndex)?.addChild(animatedSprite);
        } else if (item.type === SpriteMashItemType.Static) {
          const tile = assets[item.texture.asset].tilemaps[
            item.texture.tileset
          ].get(item.texture.tileId);
          const sprite = new Sprite(
            tile,
            new Vector(item.position.x, item.position.y)
          );
          sprite.withMeta(
            new AsepriteTextureMeta(
              item.texture.asset,
              item.texture.tileset,
              item.texture.tileId
            )
          );
          sm.getLayer(layerIndex)?.addChild(sprite);
        }
      }
    }

    return sm;
  }
}
