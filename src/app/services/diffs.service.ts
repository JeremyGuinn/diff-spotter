import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum DiffMethod {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  NEW = 'NEW',
}

export interface TextDiff extends Diff<string> {
  method: DiffMethod.TEXT;
}

export interface ImageDiff extends Diff<Blob> {
  method: DiffMethod.IMAGE;
}

export interface Diff<T> {
  diffId: string;
  title: string;
  left: T;
  right: T;
  method: DiffMethod;
}

@Injectable({
  providedIn: 'root',
})
export class DiffsService {
  private openDiffs = new Map<string, Diff<unknown>>();
  private openDiffsSubject = new BehaviorSubject<Diff<unknown>[]>([]);

  constructor() {}

  addDiff(diff: Diff<unknown>) {
    this.openDiffs.set(diff.diffId, diff);
    this.openDiffsSubject.next([...this.openDiffs.values()]);
  }

  removeDiff(diff: string) {
    this.openDiffs.delete(diff);
    this.openDiffsSubject.next([...this.openDiffs.values()]);
  }

  getOpenDiffs(): Observable<Diff<unknown>[]> {
    return this.openDiffsSubject.asObservable();
  }
}
