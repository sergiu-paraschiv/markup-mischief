import { Engine, SceneLoadedEvent } from '@engine';
import { Element } from '@engine/core';
import { TickEvent } from '@engine/renderer';

export default class Editor extends Element {
  private guiLayer: HTMLDivElement;
  private engine: Engine | undefined;
  private previousScene: Element | undefined;

  constructor(container: HTMLElement) {
    super();
    this.guiLayer = document.createElement('div');

    const canvas = container.querySelector('canvas');
    if (!canvas) {
      throw new Error('canvas not found');
    }

    this.guiLayer.style.position = 'absolute';
    this.guiLayer.style.top = '0';
    this.guiLayer.style.left = canvas.clientWidth + 'px';

    container.appendChild(this.guiLayer);

    this.on(TickEvent, this.onTick.bind(this));
  }

  attachTo(engine: Engine) {
    this.engine = engine;
    engine.on(SceneLoadedEvent, event => {
      this.attachToScene(event.scene);
    });
  }

  private attachToScene(scene: Element) {
    if (this.previousScene) {
      this.previousScene.removeChild(this);
    }

    scene.addChild(this);
    this.previousScene = scene;
  }

  private onTick(event: TickEvent) {
    event;
  }
}
