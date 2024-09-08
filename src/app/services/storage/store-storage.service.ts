import { Store } from '@tauri-apps/plugin-store';
import { StorageService } from './storage.service';
import { Inject, Injectable, InjectionToken } from '@angular/core';

export const STORE_CONFIGURATION = new InjectionToken<StoreConfiguration>('STORE_CONFIGURATION');

export interface StoreConfiguration {
  saveOnSet: boolean;
  autoSaveIntervalSeconds?: number;
}

@Injectable()
export class StoreStorageService extends StorageService {
  constructor(
    @Inject(STORE_CONFIGURATION)
    private readonly storeConfiguration: StoreConfiguration,
    private readonly store: Store,
  ) {
    super();

    if (this.storeConfiguration.autoSaveIntervalSeconds) {
      setInterval(() => {
        this.store.save();
      }, this.storeConfiguration.autoSaveIntervalSeconds || 10000);
    }
  }

  override async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await this.store.get<T>(key);
      return value ?? null;
    } catch (error) {
      console.error('Error getting from store', error);
      return null;
    }
  }

  override async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await this.store.set(key, value);
      if (this.storeConfiguration.saveOnSet) {
        await this.store.save();
      }
    } catch (error) {
      console.error('Error setting store item', error);
      throw error;
    }
  }

  override async removeItem(key: string): Promise<void> {
    try {
      await this.store.delete(key);
      if (this.storeConfiguration.saveOnSet) {
        await this.store.save();
      }
    } catch (error) {
      console.error('Error removing store item', error);
      throw error;
    }
  }

  override async clear(): Promise<void> {
    try {
      await this.store.reset();
      if (this.storeConfiguration.saveOnSet) {
        await this.store.save();
      }
    } catch (error) {
      console.error('Error clearing store', error);
      throw error;
    }
  }
}
