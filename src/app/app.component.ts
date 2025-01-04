import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Vector } from '@engine/core';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { PhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
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
      new Vector(256, 192),
      new CanvasRenderer(gameElement, 4),
      new PhysicsSimulation(),
      [new Keyboard(document.documentElement), new Mouse(gameElement)]
    );

    const dbgr = new Debugger();
    dbgr.attachTo(engine);

    const game = new Game();
    await game.init();

    engine.loadScene(game.scenes['Start']);
    engine.start(144, 30);
  }
}
