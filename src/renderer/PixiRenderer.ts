import * as PIXI from 'pixi.js';
import { Element, Query } from '@engine/core';
import { Sprite } from '@engine/elements';
import { Texture } from '@engine/loaders';
import { TickEvent } from '@engine/events';
import IRenderer from './IRenderer';

export default class PixiRenderer implements IRenderer {
  private app: PIXI.Application;
  private rootElement?: Element;

  constructor(
    private container: HTMLElement,
    private width: number,
    private height: number
  ) {
    this.app = new PIXI.Application();
  }

  setRootElement(element: Element): void {
    this.rootElement = element;
  }

  async start(maxFps: number) {
    await this.app.init({
      width: this.width,
      height: this.height,
      background: '#FFFFFF',
    });

    this.app.canvas.style.display = 'block';
    this.app.canvas.style.width = this.width * 4 + 'px';
    this.app.canvas.style.height = this.height * 4 + 'px';
    this.app.canvas.style.imageRendering = 'pixelated';

    this.container.appendChild(this.app.canvas);

    this.app.ticker.maxFPS = maxFps;

    const fpsText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 12,
        lineHeight: 12,
        letterSpacing: 0,
        fill: 0xff0000,
      },
    });

    fpsText.x = 0;
    fpsText.y = this.height - 12;
    this.app.stage.addChild(fpsText);

    let currentTime = this.app.ticker.elapsedMS;
    const spriteMap = new Map<Sprite, PIXI.Sprite>();
    const spriteTextureMap = new Map<Sprite, Texture>();
    const textureMap = new Map<Texture, PIXI.Texture>();

    this.app.ticker.add(time => {
      if (!this.rootElement) {
        return;
      }

      currentTime += time.elapsedMS;
      this.rootElement.dispatchEvent(new TickEvent(currentTime));

      const allSprites = Query.childrenByType(Sprite, this.rootElement);
      const flaggedSprites = new Map<Sprite, boolean>();

      for (const [sprite] of spriteMap) {
        flaggedSprites.set(sprite, false);
      }

      for (const sprite of allSprites) {
        let pixiSprite = spriteMap.get(sprite);
        if (!pixiSprite) {
          pixiSprite = new PIXI.Sprite();
          spriteMap.set(sprite, pixiSprite);
          this.app.stage.addChild(pixiSprite);
        }
        flaggedSprites.set(sprite, true);

        const texture = spriteTextureMap.get(sprite);
        if (texture !== sprite.texture) {
          spriteTextureMap.set(sprite, sprite.texture);

          let loadedTexture = textureMap.get(sprite.texture);
          if (!loadedTexture) {
            loadedTexture = PIXI.Texture.from(
              sprite.texture.toOffscreenCanvas()
            );
            textureMap.set(sprite.texture, loadedTexture);
          }
          pixiSprite.texture = loadedTexture;
        }

        pixiSprite.x = sprite.position.x;
        pixiSprite.y = sprite.position.y;
      }

      for (const [sprite, isFlagged] of flaggedSprites) {
        if (!isFlagged) {
          const pixiSprite = spriteMap.get(sprite);
          if (pixiSprite) {
            this.app.stage.removeChild(pixiSprite);
          }
          spriteMap.delete(sprite);
          spriteTextureMap.delete(sprite);
        }
      }

      fpsText.text = time.FPS.toFixed(0);
    });
  }
}
