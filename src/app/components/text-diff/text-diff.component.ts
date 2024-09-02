import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
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
import {
  combineLatest,
  filter,
  map,
  ReplaySubject,
  shareReplay,
  startWith,
  tap,
} from 'rxjs';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { DiffEditorComponent } from '../code-editor/diff-editor.component';
import { MergeView, unifiedMergeView } from '@codemirror/merge';

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

  diffMergeView = new ReplaySubject<MergeView>(1);

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
    originalValue: this.diffForm.controls.originalText.valueChanges.pipe(
      startWith(this.diffForm.controls.originalText.value)
    ),
  }).pipe(
    map(({ collapseLines }) => [
      unifiedMergeView({
        original: this.diffForm.controls.originalText.value,
        mergeControls: false,
        gutter: true,
        collapseUnchanged: collapseLines
          ? { margin: 3, minSize: 4 }
          : undefined,
      }),
    ])
  );

  diffStats = combineLatest({
    view: this.diffMergeView.pipe(
      filter(view => !!view),
      startWith(null)
    ),
    originalText: this.liveDiff.controls.originalText.valueChanges.pipe(
      startWith(this.liveDiff.controls.originalText.value)
    ),
    modifiedText: this.liveDiff.controls.modifiedText.valueChanges.pipe(
      startWith(this.liveDiff.controls.modifiedText.value)
    ),
  }).pipe(
    map(() => ({
      additions: 0,
      removals: 0,
      totalOriginalLines:
        this.liveDiff.controls.originalText.value.split('\n').length,
      totalModifiedLines:
        this.liveDiff.controls.modifiedText.value.split('\n').length,
    })),
    tap(console.log),
    tap(() => setTimeout(() => this.changeDetector.detectChanges()))
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
    const editor =
      e.target instanceof HTMLElement && e.target.closest('app-code-editor');
    if (editor) {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const controlKey = editor.getAttribute('data-control') as
          | 'originalText'
          | 'modifiedText';
        this.loadFileText(file, this.diffForm.controls[controlKey]);
      }
    }
  }

  openFile(control: FormControl): void {
    const input = this.document.createElement('input');
    input.type = 'file';
    input.accept = 'text/*';
    input.addEventListener('change', event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.loadFileText(file, control);
      }
    });
    input.click();
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

  clear(): void {
    this.diffSettings.patchValue({ liveEdit: false }, { emitEvent: false });
    this.diffForm.patchValue({ originalText: '', modifiedText: '' });
    this.liveDiff.patchValue({ originalText: '', modifiedText: '' });
  }

  private loadFileText(file: File, control: FormControl): void {
    const reader = new FileReader();
    reader.onload = () => control.setValue(reader.result);
    reader.readAsText(file);
  }
}
