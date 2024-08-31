import { RouterModule } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { appWindow } from '@tauri-apps/api/window';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import {
  remixCheckboxBlankLine,
  remixCheckboxMultipleBlankLine,
  remixCloseLine,
} from '@ng-icons/remixicon';

import { minimizeIcon } from '../../../assets/icons';

@Component({
  selector: 'app-titlebar',
  standalone: true,
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgIconComponent, RouterModule],
  providers: [
    provideIcons({
      remixCheckboxBlankLine,
      remixCheckboxMultipleBlankLine,
      remixCloseLine,
      minimizeIcon,
    }),
  ],
})
export class TitlebarComponent {
  protected appWindow = appWindow;

  @HostListener('window:resize')
  async onResize(): Promise<void> {
    this.isMaximized = await this.appWindow.isMaximized();
  }

  constructor() {
    this.onResize();
  }

  protected isMaximized = false;
}
