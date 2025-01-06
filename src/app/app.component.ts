import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Scene, Vector } from '@engine/core';
import { SpriteMash } from '@engine/elements';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { PhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import { Editor } from '@editor';
// import { Game } from '@game';

const ASSETS = {
  'Palm Tree Island':
    '/sprites/Treasure Hunters/Palm Tree Island/Aseprite/Palm Tree Island (ArtBoard).aseprite',
  'Pirate Ship':
    '/sprites/Treasure Hunters/Pirate Ship/Aseprite/TileSets.aseprite',
  Paper: '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Paper.aseprite',
  Chars: '/sprites/Treasure Hunters/Wood and Paper UI/Aseprite/Chars.aseprite',
  'Captain Clown Nose':
    '/sprites/Treasure Hunters/Captain Clown Nose/Aseprite/Captain Clown Nose.aseprite',
};

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

    const editor = new Editor(
      gameElement,
      canvasElement,
      ASSETS,
      renderer.localToGlobalPoint.bind(renderer)
    );
    editor.attachTo(engine);

    // const game = new Game();
    // await game.init(ASSETS);

    engine.loadScene(new Scene([new SpriteMash()]));
    // engine.loadScene(game.scenes['Basic Level']);
    engine.start(200, 200);
  }
}
