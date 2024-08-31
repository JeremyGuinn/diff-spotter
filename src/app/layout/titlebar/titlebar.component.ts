import { RouterModule } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import { appWindow } from '@tauri-apps/api/window';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import {
  remixCheckboxBlankLine,
  remixCheckboxMultipleBlankLine,
  remixCloseLine,
  remixSettingsLine,
  remixMoonLine,
  remixSunLine,
} from '@ng-icons/remixicon';

import { minimizeIcon } from '../../../assets/icons';
import { Theme, ThemeService } from '../../services/theme.service';
import { BehaviorSubject } from 'rxjs';

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
      remixSettingsLine,
      remixMoonLine,
      remixSunLine,
    }),
  ],
})
export class TitlebarComponent {
  private readonly themeService = inject(ThemeService);

  protected theme = this.themeService.getTheme();
  protected maximized = new BehaviorSubject<boolean>(false);

  protected async setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  @HostListener('window:resize')
  async onResize(): Promise<void> {
    this.maximized.next(await appWindow.isMaximized());
  }

  constructor() {
    this.onResize();
  }

  async closeWindow() {
    await appWindow.close();
  }

  async minimizeWindow() {
    await appWindow.minimize();
  }

  async toggleMaximizeWindow() {
    await appWindow.toggleMaximize();
  }
}
