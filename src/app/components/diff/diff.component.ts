import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  Input,
} from '@angular/core';
import { DiffMethod, DiffsService } from '@app/services/diffs.service';
import { BehaviorSubject, combineLatest, filter, map, take, tap } from 'rxjs';
import { NewDiffComponent } from '../new-diff/new-diff.component';
import { TextDiffComponent } from '../text-diff/text-diff.component';
import { Router } from '@angular/router';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

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

  private readonly id$ = new BehaviorSubject<string>('');

  @Input() set id(value: string) {
    this.id$.next(value);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'w' && event.ctrlKey) {
      this.closeDiff(this.id$.value);
    }
  }

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

  closeDiff(diffId: string) {
    this.diffsService
      .getOpenDiffs()
      .pipe(take(1))
      .subscribe(tabs => {
        if (tabs.length === 1) {
          appWindow.close();
          return;
        }

        this.diffsService.removeDiff(diffId);
        const currentTabIndex = tabs.findIndex(tab => tab.diffId === diffId);
        const previousTab = tabs.at(currentTabIndex - 1);
        this.router.navigate(['/tabs', previousTab!.diffId]);
      });
  }

  private getDiffTitle(method: DiffMethod): string {
    const methodTitle = method
      .toLocaleLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
    return `${methodTitle} Diff`;
  }
}
