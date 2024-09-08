import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DiffType, Diff } from './diffs';

@Injectable({
  providedIn: 'root',
})
export class DiffsService {
  private openDiffs = new Map<string, Diff<unknown>>();
  private openDiffsSubject = new BehaviorSubject<Diff<unknown>[]>([]);

  saveDiff<T extends DiffType>(diff: T, { emit = true } = {}) {
    this.openDiffs.set(diff.diffId, diff);
    if (emit) {
      this.openDiffsSubject.next([...this.openDiffs.values()]);
    }
  }

  removeDiff(diff: string, { emit = true } = {}) {
    this.openDiffs.delete(diff);
    if (emit) {
      this.openDiffsSubject.next([...this.openDiffs.values()]);
    }
  }

  getOpenDiffs(): Observable<Diff<unknown>[]> {
    return this.openDiffsSubject.asObservable();
  }
}
