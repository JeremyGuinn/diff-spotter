import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ThemeService, ThemeSettings } from './services/theme.service';
import { PreferencesService } from './services/preferences.service';
import { LocalStorageService } from './services/storage/local-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),

    {
      provide: ThemeService,
      useFactory: () => {
        const storageService = new LocalStorageService();
        const preferencesService = new PreferencesService<ThemeSettings>(
          storageService
        );

        return new ThemeService(preferencesService);
      },
    },

    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ThemeService],
      useFactory: (themeService: ThemeService) => async () => {
        await themeService.initializeTheme();
      },
    },
  ],
};
