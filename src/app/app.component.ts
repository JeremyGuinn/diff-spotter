import { Component, HostListener, inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { TitlebarComponent } from './layout/titlebar/titlebar.component';
import { TextDiffComponent } from './diffs/text/text.component';

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

  @HostListener('window:resize')
  async onResize(): Promise<void> {
    if (await appWindow.isMaximized()) {
      this.renderer.addClass(this.document.body, 'maximized');
    } else {
      this.renderer.removeClass(this.document.body, 'maximized');
    }
  }

  constructor() {
    this.onResize();
  }

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    invoke<string>('greet', { name }).then(text => {
      this.greetingMessage = text;
    });
  }
}
