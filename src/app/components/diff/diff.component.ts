import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  Input,
} from '@angular/core';
import { DiffsService } from '@app/services/diffs.service';
import {
  DiffMethod,
  NewDiff,
  TextDiff,
  TextDiffSettings,
} from '@app/services/diffs';
import { BehaviorSubject, combineLatest, filter, map, take } from 'rxjs';
import { NewDiffComponent } from '../new-diff/new-diff.component';
import { TextDiffComponent } from '../text-diff/text-diff.component';
import { Router } from '@angular/router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ImageDiffComponent } from '../image-diff/image-diff.component';

const appWindow = getCurrentWindow();

@Component({
  selector: 'app-diff',
  standalone: true,
  imports: [
    CommonModule,
    NewDiffComponent,
    TextDiffComponent,
    ImageDiffComponent,
  ],
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
    filter(diff => !!diff)
  );

  newDiff(diff: NewDiff, method: DiffMethod) {
    this.diffsService.saveDiff({
      ...diff,
      title: this.getDiffTitle(method),
      method,
    });
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

  updateTextDiffed(diff: TextDiff) {
    this.diffsService.saveDiff({
      ...diff,
      data: {
        ...diff.data,
        diffed: true,
      },
    });
  }

  updateTextDiffSettings(diff: TextDiff, settings: TextDiffSettings) {
    console.log(diff, settings);
    this.diffsService.saveDiff({
      ...diff,
      data: {
        ...diff.data,
        settings,
      },
    });
  }

  updateTextDiffItems(
    diff: TextDiff,
    texts: { originalText: string; modifiedText: string }
  ) {
    this.diffsService.saveDiff({
      ...diff,
      data: {
        ...diff.data,
        originalText: texts.originalText,
        modifiedText: texts.modifiedText,
      },
    });
  }

  updateImageDiffItems(files: {
    original: File | null;
    modified: File | null;
  }) {
    this.diffsService.saveDiff({
      diffId: this.id$.value,
      title: this.getDiffTitle(DiffMethod.IMAGE),
      method: DiffMethod.IMAGE,
      data: {
        originalSrc: this.getSrc(files.original),
        modifiedSrc: this.getSrc(files.modified),
        originalFile: files.original,
        modifiedFile: files.modified,
      },
    });
  }

  private getSrc(file: File | null): string {
    return file ? URL.createObjectURL(file) : '';
  }

  private getDiffTitle(method: DiffMethod): string {
    const methodTitle = method
      .toLocaleLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
    return `${methodTitle} Diff`;
  }
}
