import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixFileAddLine,
  remixShareForwardBoxLine,
  remixSaveLine,
  remixAddCircleFill,
  remixIndeterminateCircleFill,
  remixArrowLeftRightFill,
} from '@ng-icons/remixicon';
import { materialDark, materialLight } from '@uiw/codemirror-theme-material';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ThemeService } from '../../services/theme.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, shareReplay, startWith, tap } from 'rxjs';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { DiffEditorComponent } from '../code-editor/diff-editor.component';
import { unifiedMergeView } from '@codemirror/merge';
import { findLine } from '@lib/strings';

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIconComponent,
    CodeEditorComponent,
    DiffEditorComponent,
  ],
  providers: [
    provideIcons({
      remixFileAddLine,
      remixShareForwardBoxLine,
      remixSaveLine,
      remixAddCircleFill,
      remixIndeterminateCircleFill,
      remixArrowLeftRightFill,
    }),
  ],
  templateUrl: './text-diff.component.html',
  styleUrl: './text-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDiffComponent {
  protected readonly EditorState = EditorState;
  protected readonly EditorView = EditorView;
  protected readonly unifiedMergeView = unifiedMergeView;

  protected readonly changeDetector = inject(ChangeDetectorRef);
  protected readonly document = inject(DOCUMENT);
  protected readonly themeService = inject(ThemeService);

  @ViewChild('diffEditor', { read: DiffEditorComponent })
  private readonly diffEditor?: DiffEditorComponent;

  @ViewChild('unifiedDiffEditor', { read: CodeEditorComponent })
  private readonly unifiedDiffEditor?: CodeEditorComponent;

  editorTheme = this.themeService.getTheme().pipe(
    map(theme => (theme === 'dark' ? materialDark : materialLight)),
    // Theme changes may occur outside of Angular's zone, due to the menu option, so we need to trigger change detection manually
    tap(() => setTimeout(() => this.changeDetector.detectChanges())),
    shareReplay(1)
  );

  diffSettings = new FormGroup({
    liveEdit: new FormControl<boolean>(false, { nonNullable: true }),
    unifiedDiff: new FormControl<boolean>(false, { nonNullable: true }),
    collapseLines: new FormControl<boolean>(false, { nonNullable: true }),
  });

  diffForm = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
  });

  liveDiff = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
  });

  diffExtensions = combineLatest({
    editable: this.diffSettings.controls.liveEdit.valueChanges.pipe(
      startWith(this.diffSettings.controls.liveEdit.value)
    ),
    editorTheme: this.editorTheme,
  }).pipe(
    map(({ editable, editorTheme }) => [
      EditorView.editable.of(editable),
      EditorState.readOnly.of(!editable),
      EditorView.lineWrapping,
      editorTheme,
    ]),
    shareReplay(1)
  );

  unifiedDiffExtensions = combineLatest({
    collapseLines: this.diffSettings.controls.collapseLines.valueChanges.pipe(
      startWith(this.diffSettings.controls.collapseLines.value)
    ),
    originalValue: this.liveDiff.controls.originalText.valueChanges.pipe(
      startWith(this.liveDiff.controls.originalText.value)
    ),
  }).pipe(
    map(({ collapseLines, originalValue }) => [
      unifiedMergeView({
        original: originalValue,
        mergeControls: false,
        gutter: true,
        collapseUnchanged: collapseLines
          ? { margin: 3, minSize: 4 }
          : undefined,
      }),
    ])
  );

  removals = this.liveDiff.controls.originalText.valueChanges.pipe(
    startWith(this.liveDiff.controls.originalText.value),
    map(text => this.getRemovals(text))
  );

  additions = this.liveDiff.controls.modifiedText.valueChanges.pipe(
    startWith(this.liveDiff.controls.modifiedText.value),
    map(text => this.getAdditions(text))
  );

  constructor() {
    this.diffSettings.controls.liveEdit.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(liveEdit => !!liveEdit)
      )
      .subscribe(() => {
        this.liveDiff.patchValue({
          originalText: this.diffForm.controls.originalText.value,
          modifiedText: this.diffForm.controls.modifiedText.value,
        });
      });
  }

  @HostListener('dragover', ['$event'])
  @HostListener('drop', ['$event'])
  allowFileDrop(e: DragEvent): void {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest('app-code-editor')
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  pluralMapping(word: string) {
    return {
      '=0': `# ${word}s`,
      '=1': `# ${word}`,
      other: `# ${word}s`,
    };
  }

  findDiff() {
    this.liveDiff.patchValue({
      originalText: this.diffForm.controls.originalText.value,
      modifiedText: this.diffForm.controls.modifiedText.value,
    });
  }

  swapTexts() {
    this.diffForm.patchValue({
      originalText: this.diffForm.controls.modifiedText.value,
      modifiedText: this.diffForm.controls.originalText.value,
    });
    this.liveDiff.patchValue({
      originalText: this.diffForm.controls.originalText.value,
      modifiedText: this.diffForm.controls.modifiedText.value,
    });
  }

  openFile(control: FormControl): void {
    const input = this.document.createElement('input');
    input.type = 'file';
    input.accept = 'text/*';
    input.addEventListener('change', event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          control.setValue(reader.result);
        };
        reader.readAsText(file);
      }
    });
    input.click();
  }

  clear(): void {
    this.diffSettings.patchValue({ liveEdit: false }, { emitEvent: false });
    this.diffForm.patchValue({ originalText: '', modifiedText: '' });
    this.liveDiff.patchValue({ originalText: '', modifiedText: '' });
  }

  getLines(text: string): number {
    return text.split('\n').length;
  }

  getCount(text: string, from: number, to: number): number {
    if (from === to) {
      return 0;
    }

    const end = findLine(text, Math.min(to, text.length)).number;
    const start = findLine(text, from).number;
    return start === end ? 1 : end - start;
  }

  getAdditions(text: string): number {
    return (
      this.diffEditor?.mergeView?.chunks.reduce(
        (additions, chunk) =>
          (additions += this.getCount(text, chunk.fromA, chunk.toA)),
        0
      ) ?? 0
    );
  }

  getRemovals(text: string): number {
    return (
      this.diffEditor?.mergeView?.chunks.reduce(
        (removals, chunk) =>
          (removals += this.getCount(text, chunk.fromB, chunk.toB)),
        0
      ) ?? 0
    );
  }
}
