import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Vector } from '@engine/core';
import { Scene } from '@engine/core';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { PhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import { SpriteMash } from '@engine/elements';
import { Editor } from '@editor';

import ASSETS from '../assets.json';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('game') gameElement: ElementRef<HTMLElement> | undefined;
  @ViewChild('canvas') canvasElement: ElementRef<HTMLCanvasElement> | undefined;

  async ngAfterViewInit(): Promise<void> {
    const gameElement = this.gameElement?.nativeElement;
    const canvasElement = this.canvasElement?.nativeElement;
    if (!gameElement) {
      throw new Error('Game element not found!');
    }
    if (!canvasElement) {
      throw new Error('Game canvas not found!');
    }

    const renderer = new CanvasRenderer(canvasElement, 2);

    const engine = new Engine(
      new Vector(512, 384),
      renderer,
      new PhysicsSimulation(),
      [
        new Keyboard(document.documentElement),
        new Mouse(canvasElement, renderer.globalToLocalPoint.bind(renderer)),
      ]
    );

    const dbgr = new Debugger(gameElement);
    dbgr.attachTo(engine);
    dbgr.enableFps = true;
    dbgr.enableGridLines = true;
    dbgr.enablePhysicsDebugLines = true;
    dbgr.enableHoverHighlight = true;

    const editor = new Editor(
      gameElement,
      canvasElement,
      ASSETS.dynamic,
      renderer.localToGlobalPoint.bind(renderer)
    );
    editor.attachTo(engine);

    engine.loadScene(new Scene([new SpriteMash(5)]));

    engine.start(200, 200);
  }
}
