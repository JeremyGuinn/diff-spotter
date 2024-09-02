import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable()
export class InMemoryStorageService extends StorageService {
  private readonly storage = new Map<string, unknown>();

  override async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = this.storage.get(key);
      return value ? (value as T) : null;
    } catch (error) {
      console.error('Error getting from in-memory storage', error);
      throw error;
    }
  }

  override async setItem<T>(key: string, value: T): Promise<void> {
    try {
      this.storage.set(key, value);
    } catch (error) {
      console.error('Error setting in-memory storage', error);
      throw error;
    }
  }

  override async removeItem(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      console.error('Error removing from in-memory storage', error);
      throw error;
    }
  }

  override async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing in-memory storage', error);
      throw error;
    }
  }
}
