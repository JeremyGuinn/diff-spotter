/**
 * Abstract storage service that defines the contract for interacting with different storage types.
 * This could be in-memory storage, local storage, SQL, etc.
 */
export abstract class StorageService {
  abstract getItem<T>(key: string): Promise<T | null>;
  abstract setItem<T>(key: string, value: T): Promise<void>;
  abstract removeItem(key: string): Promise<void>;
  abstract clear(): Promise<void>;
}
