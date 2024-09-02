import { ApplicationRef, Injectable } from '@angular/core';
import { Menu, Submenu } from '@tauri-apps/api/menu';
import { Theme, ThemeService } from './theme.service';

const macOS = navigator.userAgent.includes('Macintosh');

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(
    private themeService: ThemeService,
    private applicationRef: ApplicationRef
  ) {}

  async initMenus(): Promise<void> {
    const menu = await Menu.default();
    const items = await menu.items();
    const windowMenuIndex = items.findIndex(
      item => item.id === '__tauri_window_menu__'
    );

    const themeSubMenu = await Submenu.new({
      text: 'Theme',
      items: [
        {
          text: 'System',
          id: 'system',
          action: () => this.updateTheme('system'),
        },
        {
          text: 'Light',
          id: 'light',
          action: () => this.updateTheme('light'),
        },
        {
          text: 'Dark',
          id: 'dark',
          action: () => this.updateTheme('dark'),
        },
      ],
    });

    menu.insert(themeSubMenu, windowMenuIndex);

    await (macOS ? menu.setAsAppMenu() : menu.setAsWindowMenu());
  }

  private updateTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
