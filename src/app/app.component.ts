import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { Keyboard, Mouse } from '@engine/input';
import { CanvasRenderer } from '@renderer';
import { RapierPhysicsSimulation } from '@engine/physics';
import { Debugger } from '@debugger';
import StartScene from '../game/scenes/StartScene';

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
      new CanvasRenderer(gameElement, 256, 192),
      new RapierPhysicsSimulation(),
      [new Keyboard(document.documentElement), new Mouse(gameElement)]
    );

    const scene = new StartScene();

    engine.loadScene(scene);
    engine.start(144, 60);

    const dbgr = new Debugger();
    dbgr.attachToScene(scene);
  }
}
