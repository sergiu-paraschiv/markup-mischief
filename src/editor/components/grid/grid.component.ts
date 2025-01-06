import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Vector } from '@engine/core';

@Component({
  selector: 'grid',
  standalone: true,
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css',
})
export class GridComponent implements OnChanges {
  @Input() position = new Vector(0, 0);
  @Input() size = new Vector(0, 0);
  @Input() step = new Vector(32, 32);

  ngOnChanges(changes: SimpleChanges): void {
    const grid = this.ensureGridElement();
    grid.style.left = this.position.left + 'px';
    grid.style.top = this.position.top + 'px';
    grid.style.width = this.size.width + 'px';
    grid.style.height = this.size.height + 'px';
    grid.style.outline = '1px solid red';

    if (changes['step'] || changes['size']) {
      grid.innerHTML = '';

      for (let i = this.step.x; i < this.size.width; i += this.step.x) {
        const gridLine = document.createElement('div');
        gridLine.style.position = 'absolute';
        gridLine.style.top = '0';
        gridLine.style.left = i + 'px';
        gridLine.style.height = '100%';
        gridLine.style.borderLeft = '1px solid red';
        grid.appendChild(gridLine);
      }

      for (let j = this.step.y; j < this.size.height; j += this.step.y) {
        const gridLine = document.createElement('div');
        gridLine.style.position = 'absolute';
        gridLine.style.top = j + 'px';
        gridLine.style.left = '0';
        gridLine.style.width = '100%';
        gridLine.style.borderTop = '1px solid red';
        grid.appendChild(gridLine);
      }
    }
  }

  private ensureGridElement() {
    let gridElement = document.getElementById('grid');
    if (!gridElement) {
      gridElement = document.createElement('div');
      gridElement.style.position = 'absolute';
      gridElement.style.pointerEvents = 'none';
      gridElement.id = 'grid';
      document.documentElement.appendChild(gridElement);
    }

    return gridElement;
  }
}
