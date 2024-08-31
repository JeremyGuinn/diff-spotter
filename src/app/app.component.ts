import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TextDiffComponent } from './components/text-diff/text-diff.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TextDiffComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {}

  @HostListener('window:dragover', ['$event'])
  preventFileDrop(e: DragEvent): void {
    if (e) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }
}
