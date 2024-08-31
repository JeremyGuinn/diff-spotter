import { Component, HostListener, inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { appWindow } from '@tauri-apps/api/window';
import { TitlebarComponent } from './layout/titlebar/titlebar.component';
import { TextDiffComponent } from './components/text-diff/text-diff.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TitlebarComponent, TextDiffComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);

  greetingMessage = '';

  constructor() {}

  @HostListener('window:resize')
  async onResize(): Promise<void> {
    if (await appWindow.isMaximized()) {
      this.renderer.addClass(this.document.body, 'maximized');
    } else {
      this.renderer.removeClass(this.document.body, 'maximized');
    }
  }

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
