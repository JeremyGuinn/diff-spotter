import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  of,
  switchMap,
  take,
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
    if (!this.preferencesSubjects.has(key)) {
      this.preferencesSubjects.set(key, new BehaviorSubject<T | null>(null));
    }

    const preferenceSubject = this.preferencesSubjects.get(key)!;

    this.storage.getItem<T>(key).then(preferences => {
      preferenceSubject.next(preferences);
    });

    return preferenceSubject.asObservable();
  }

  public async setPreferences(key: string, preferences: T): Promise<void> {
    await this.storage.setItem(key, preferences);

    const preferenceSubject = this.preferencesSubjects.get(key);
    if (preferenceSubject) {
      preferenceSubject.next(preferences);
    }
  }

  public clearPreferences(key: string): Promise<void> {
    this.preferencesSubjects.delete(key);
    return this.storage.removeItem(key);
  }

  public updatePreferences(
    key: string,
    partialPreferences: Partial<T>
  ): Promise<void> {
    return firstValueFrom(
      this.getPreferences(key).pipe(
        take(1),
        switchMap(existingPreferences => {
          if (!existingPreferences) {
            return of();
          }

          return this.setPreferences(key, {
            ...existingPreferences,
            ...partialPreferences,
          });
        })
      )
    );
  }

  public ensurePreferences(
    key: string,
    defaultPreferences: T
  ): Observable<void> {
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

        return of();
      })
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
