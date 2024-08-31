import { Observable } from 'rxjs';

export abstract class StorageService {
  abstract getItem<T>(key: string): Observable<T | null>;
  abstract setItem<T>(key: string, value: T): Observable<boolean>;
  abstract removeItem(key: string): Observable<boolean>;
  abstract clear(): Observable<boolean>;
}
