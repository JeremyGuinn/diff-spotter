import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { DiffMethod, DiffsService } from '@app/services/diffs.service';
import { BehaviorSubject, combineLatest, filter, map, tap } from 'rxjs';
import { NewDiffComponent } from '../new-diff/new-diff.component';
import { TextDiffComponent } from '../text-diff/text-diff.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-diff',
  standalone: true,
  imports: [CommonModule, NewDiffComponent, TextDiffComponent],
  templateUrl: './diff.component.html',
  styleUrl: './diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffComponent {
  private readonly router = inject(Router);
  private readonly diffsService = inject(DiffsService);

  @Input() set id(value: string) {
    this.id$.next(value);
  }

  private id$ = new BehaviorSubject<string>('');

  diff$ = combineLatest({
    id: this.id$,
    diffs: this.diffsService.getOpenDiffs(),
  }).pipe(
    map(({ id, diffs }) => diffs.find(diff => diff.diffId === id)),
    filter(diff => !!diff),
    tap(console.log)
  );

  newDiff(method: DiffMethod) {
    const newDiff = {
      diffId: crypto.randomUUID(),
      title: this.getDiffTitle(method),
      left: '',
      right: '',
      method,
    };

    this.diffsService.removeDiff(this.id$.value);
    this.diffsService.addDiff(newDiff);
    this.router.navigate(['/tabs', newDiff.diffId]);
  }

  private getDiffTitle(method: DiffMethod): string {
    const methodTitle = method
      .toLocaleLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
    return `${methodTitle} Diff`;
  }
}
