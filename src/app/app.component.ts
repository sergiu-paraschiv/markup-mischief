import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Engine } from '@engine';
import { CanvasRenderer } from '@renderer';
import StartScene from '../game/scenes/StartScene';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('game') canvas: ElementRef<HTMLCanvasElement> | undefined;

  ngAfterViewInit(): void {
    const canvasElement = this.canvas?.nativeElement;
    if (!canvasElement) {
      throw new Error('Canvas not found!');
    }

    const context = canvasElement.getContext('2d');
    if (!context) {
      throw new Error('CanvasRenderingContext2D could not be obtained!');
    }

    const engine = new Engine(new CanvasRenderer(context, canvasElement));

    engine.loadScene(new StartScene());
    engine.start(10);
  }
}
