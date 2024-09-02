import { inject, Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';
import {
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  startWith,
  tap,
} from 'rxjs';
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
    let themePrefs = await firstValueFrom(
      this.preferenceService.getPreferences(this.THEME_PREFERENCE_KEY)
    );

    if (!themePrefs) {
      themePrefs = {
        theme: 'system',
      };

      this.preferenceService.setPreferences(
        this.THEME_PREFERENCE_KEY,
        themePrefs
      );
    }

    this.setTheme(themePrefs.theme);
  }

  public getTheme(): Observable<Theme> {
    const themeFromSystem = this.getSystemTheme();
    const themePrefs = this.preferenceService
      .getPreferences(this.THEME_PREFERENCE_KEY)
      .pipe(
        map(theme => theme?.theme || 'system'),
        tap(theme => console.log('themeService: ', theme))
      );

    // listen to the user's preference, if changes to 'system' then listen to system theme, otherwise apply the user's preference
    return combineLatest([themePrefs, themeFromSystem]).pipe(
      tap(([theme, systemTheme]) =>
        console.log('combineLatest: ', theme, systemTheme)
      ),
      map(([theme, systemTheme]) => (theme === 'system' ? systemTheme : theme))
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

  private getSystemTheme(): Observable<Theme> {
    return new Observable<Theme>(observer => {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

      const listener = (event: MediaQueryListEvent) => {
        const newColorScheme = event.matches ? 'dark' : 'light';
        observer.next(newColorScheme);
      };

      mediaQueryList.addEventListener('change', listener);

      return () => {
        mediaQueryList.removeEventListener('change', listener);
      };
    }).pipe(startWith(this.matchSystemTheme()));
  }

  private matchSystemTheme(): Exclude<Theme, 'system'> {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private applyTheme(theme: Theme) {
    if (theme === 'system') {
      theme = this.matchSystemTheme();
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
