import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class InMemoryStorageService extends StorageService {
  private readonly storage = new Map<string, unknown>();

  override getItem<T>(key: string): Observable<T | null> {
    try {
      const value = this.storage.get(key);
      return of(value ? (value as T) : null);
    } catch (error) {
      console.error('Error getting from in-memory storage', error);
      return of(null);
    }
  }
  override setItem<T>(key: string, value: T): Observable<boolean> {
    try {
      this.storage.set(key, value);
      return of(true);
    } catch (error) {
      console.error('Error setting in-memory storage', error);
      return of(false);
    }
  }
  override removeItem(key: string): Observable<boolean> {
    try {
      this.storage.delete(key);
      return of(true);
    } catch (error) {
      console.error('Error removing from in-memory storage', error);
      return of(false);
    }
  }
  override clear(): Observable<boolean> {
    try {
      this.storage.clear();
      return of(true);
    } catch (error) {
      console.error('Error clearing in-memory storage', error);
      return of(false);
    }
  }
}
