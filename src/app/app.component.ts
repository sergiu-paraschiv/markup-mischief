import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Vector } from '@engine/core';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@engine/renderer';
import { RapierPhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import { StartScene } from '@game/scenes';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('game') gameElement: ElementRef<HTMLElement> | undefined;

  ngAfterViewInit(): void {
    const gameElement = this.gameElement?.nativeElement;
    if (!gameElement) {
      throw new Error('Game element not found!');
    }

    const engine = new Engine(
      new Vector(256, 192),
      new CanvasRenderer(gameElement, 4),
      new RapierPhysicsSimulation(24),
      [new Keyboard(document.documentElement), new Mouse(gameElement)]
    );

    const dbgr = new Debugger();
    dbgr.attachTo(engine);

    const scene = new StartScene();
    engine.loadScene(scene);
    engine.start(144, 60);
  }
}
