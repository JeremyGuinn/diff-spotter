import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class LocalStorageService extends StorageService {
  override getItem<T>(key: string): Observable<T | null> {
    try {
      const item = localStorage.getItem(key);
      return of(item ? JSON.parse(item) : null);
    } catch (error) {
      console.error('Error getting from local storage', error);
      return of(null);
    }
  }

  override setItem<T>(key: string, value: T): Observable<boolean> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return of(true);
    } catch (error) {
      console.error('Error setting local storage', error);
      return of(false);
    }
  }

  override removeItem(key: string): Observable<boolean> {
    try {
      localStorage.removeItem(key);
      return of(true);
    } catch (error) {
      console.error('Error removing from local storage', error);
      return of(false);
    }
  }

  override clear(): Observable<boolean> {
    try {
      localStorage.clear();
      return of(true);
    } catch (error) {
      console.error('Error clearing local storage', error);
      return of(false);
    }
  }
}
