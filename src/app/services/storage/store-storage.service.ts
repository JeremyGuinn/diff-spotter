import { Store } from 'tauri-plugin-store-api';
import { StorageService } from './storage.service';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, from, map, Observable, of, tap } from 'rxjs';

export const STORE_CONFIGURATION = new InjectionToken<StoreConfiguration>(
  'STORE_CONFIGURATION'
);

interface StoreConfiguration {
  saveOnSet: boolean;
  autoSaveIntervalSeconds?: number;
}

@Injectable()
export class StoreStorageService extends StorageService {
  constructor(
    @Inject(STORE_CONFIGURATION)
    private readonly storeConfiguration: StoreConfiguration,
    private readonly store: Store
  ) {
    super();

    if (this.storeConfiguration.autoSaveIntervalSeconds) {
      setInterval(() => {
        this.store.save();
      }, this.storeConfiguration.autoSaveIntervalSeconds || 10000);
    }
  }

  override getItem<T>(key: string): Observable<T | null> {
    return from(this.store.get(key)).pipe(
      map(value => {
        return value as T;
      }),
      catchError(() => of(null))
    );
  }

  override setItem<T>(key: string, value: T): Observable<boolean> {
    return from(this.store.set(key, value)).pipe(
      tap(() => this.storeConfiguration.saveOnSet && this.store.save()),
      map(() => true),
      catchError(() => of(false))
    );
  }

  override removeItem(key: string): Observable<boolean> {
    return from(this.store.delete(key)).pipe(
      tap(() => this.storeConfiguration.saveOnSet && this.store.save()),
      map(() => true),
      catchError(() => of(false))
    );
  }

  override clear(): Observable<boolean> {
    return from(this.store.clear()).pipe(
      tap(() => this.storeConfiguration.saveOnSet && this.store.save()),
      map(() => true),
      catchError(() => of(false))
    );
  }
}
