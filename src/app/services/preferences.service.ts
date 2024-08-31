import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { StorageService } from './storage/storage.service';

@Injectable()
export class PreferencesService<T extends object> {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService
  ) {}

  private readonly preferencesSubjects = new Map<
    string,
    BehaviorSubject<T | null>
  >();

  public getPreferences(key: string): Observable<T | null> {
    let preferenceSubject = this.preferencesSubjects.get(key);

    if (!preferenceSubject) {
      preferenceSubject = new BehaviorSubject<T | null>(null);
      this.preferencesSubjects.set(key, preferenceSubject);

      this.storage.getItem<T>(key).subscribe(value => {
        preferenceSubject!.next(value);
      });
    }

    return preferenceSubject.asObservable();
  }

  public setPreferences(key: string, preferences: T) {
    return this.storage.setItem(key, preferences).pipe(
      tap(success => {
        if (success) {
          this.preferencesSubjects.get(key)?.next(preferences);
        }
      }),
      catchError(() => of(false))
    );
  }

  public clearPreferences(key: string) {
    return this.storage.removeItem(key).pipe(
      tap(success => {
        if (success) {
          this.preferencesSubjects.get(key)?.next(null);
        }
      }),
      catchError(() => of(false))
    );
  }

  public updatePreferences(
    key: string,
    partialPreferences: Partial<T>
  ): Observable<boolean> {
    return this.getPreferences(key).pipe(
      switchMap(existingPreferences => {
        if (!existingPreferences) {
          return of(false);
        }

        return this.setPreferences(key, {
          ...existingPreferences,
          ...partialPreferences,
        });
      }),
      catchError(() => of(false))
    );
  }

  public ensurePreferences(
    key: string,
    defaultPreferences: T
  ): Observable<boolean> {
    return this.getPreferences(key).pipe(
      switchMap(preferences => {
        if (
          !preferences ||
          !this.validatePreferencesStructure(preferences, defaultPreferences)
        ) {
          return this.setPreferences(
            key,
            this.rectifyPreferencesStructure(preferences, defaultPreferences)
          );
        }

        return of(true);
      }),
      catchError(() => of(false))
    );
  }

  private validatePreferencesStructure(
    preferences: T,
    defaultPreferences: T
  ): preferences is T {
    return Object.keys(defaultPreferences).every(key => key in preferences);
  }

  private rectifyPreferencesStructure(
    preferences: T | null,
    defaultPreferences: T
  ): T {
    return Object.keys(defaultPreferences).reduce((acc, key) => {
      acc[key as keyof T] =
        preferences?.[key as keyof T] ?? defaultPreferences[key as keyof T];
      return acc;
    }, {} as T);
  }
}
