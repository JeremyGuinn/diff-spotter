import { inject, Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';
import { firstValueFrom, map, Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSettings {
  theme: Theme;
}

@Injectable()
export class ThemeService {
  private readonly THEME_PREFERENCE_KEY = 'theme';
  private readonly document = inject(DOCUMENT);

  constructor(
    private readonly preferenceService: PreferencesService<ThemeSettings>
  ) {}

  public async initializeTheme(): Promise<void> {
    const savedTheme = await firstValueFrom(
      this.preferenceService.getPreferences(this.THEME_PREFERENCE_KEY)
    );

    if (!savedTheme) {
      this.setTheme('system');
    }

    this.getTheme().subscribe(theme => {
      this.applyTheme(theme);
    });
  }

  public getTheme(): Observable<Theme> {
    return this.preferenceService
      .getPreferences(this.THEME_PREFERENCE_KEY)
      .pipe(
        map(settings => {
          return settings?.theme || 'system';
        })
      );
  }

  public setTheme(theme: Theme): void {
    if (theme === 'system') {
      this.listenForSystemThemeChanges();
    } else {
      this.clearListeners();
    }

    this.applyTheme(theme);
    this.preferenceService.setPreferences(this.THEME_PREFERENCE_KEY, { theme });
  }

  private applyTheme(theme: string) {
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    this.document.body.setAttribute('data-theme', theme);
  }

  private listenForSystemThemeChanges() {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', this.updateThemeFromSystem.bind(this));
  }

  private clearListeners() {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .removeEventListener('change', this.updateThemeFromSystem.bind(this));
  }

  private updateThemeFromSystem(event: MediaQueryListEvent) {
    const newColorScheme = event.matches ? 'dark' : 'light';
    this.applyTheme(newColorScheme);
  }
}
