import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Vector } from '@engine/core';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { PhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import { Editor } from '@editor';
import { Game } from '@game';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('game') gameElement: ElementRef<HTMLElement> | undefined;

  async ngAfterViewInit(): Promise<void> {
    const gameElement = this.gameElement?.nativeElement;
    if (!gameElement) {
      throw new Error('Game element not found!');
    }

    const engine = new Engine(
      new Vector(512, 384),
      new CanvasRenderer(gameElement, 2),
      new PhysicsSimulation(),
      [new Keyboard(document.documentElement), new Mouse(gameElement)]
    );

    const dbgr = new Debugger(gameElement);
    dbgr.attachTo(engine);

    const editor = new Editor(gameElement);
    editor.attachTo(engine);

    const game = new Game();
    await game.init();

    // engine.loadScene(game.scenes['Sprite Mash Editor']);
    engine.loadScene(game.scenes['Basic Level']);
    engine.start(200, 200);
  }
}
