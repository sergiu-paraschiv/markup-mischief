import { Element, GlobalContext, Vector } from '@engine/core';
import Sprite from './Sprite';
import { AsepriteTextureMeta, AsepriteTextureMetaData } from '@engine/loaders';

export interface SpriteMashData {
  numLayers: number;
  layers: {
    position: { x: number; y: number };
    texture: AsepriteTextureMetaData;
  }[][];
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
      const layerItems = [];

      for (const child of this.children[i].children) {
        if (child instanceof Sprite) {
          const textureMeta = child.getMeta();
          if (textureMeta instanceof AsepriteTextureMeta) {
            layerItems.push({
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

    return sm;
  }
}
