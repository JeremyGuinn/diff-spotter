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
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ThemeService } from '../../services/theme.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  delay,
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
import { calculateLinesRemovedAndAdded } from '@lib/diffs';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

import { language } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { htmlLanguage, html } from '@codemirror/lang-html';

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
    CopyButtonComponent,
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
    language: new FormControl<string>('text', { nonNullable: true }),
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

  languageConf = new Compartment();

  autoLanguage = EditorState.transactionExtender.of(tr => {
    if (!tr.docChanged) return null;
    const docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100));
    const stateIsHTML = tr.startState.facet(language) == htmlLanguage;
    if (docIsHTML == stateIsHTML) return null;
    return {
      effects: this.languageConf.reconfigure(docIsHTML ? html() : javascript()),
    };
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
      this.languageConf.of(javascript()),
      this.autoLanguage,
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
      this.languageConf.of(javascript()),
      this.autoLanguage,
      EditorView.lineWrapping,
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
    originalText: this.diffForm.controls.originalText.valueChanges.pipe(
      startWith(this.diffForm.controls.originalText.value)
    ),
    modifiedText: this.diffForm.controls.modifiedText.valueChanges.pipe(
      startWith(this.diffForm.controls.modifiedText.value)
    ),
  }).pipe(
    delay(0),
    map(({ view }) => {
      const originalText = this.diffForm.controls.originalText.value;
      const totalOriginalLines = originalText.split('\n').length;

      const modifiedText = this.diffForm.controls.modifiedText.value;
      const totalModifiedLines = modifiedText.split('\n').length;

      const { removals: chunkLinesRemoved, additions: chunkLinesAdded } =
        calculateLinesRemovedAndAdded(
          view?.chunks ?? [],
          originalText,
          modifiedText
        );

      return {
        removals: chunkLinesRemoved,
        additions: chunkLinesAdded,
        totalOriginalLines: totalOriginalLines,
        totalModifiedLines: totalModifiedLines,
      };
    })
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
    this.liveDiff.patchValue({
      originalText: this.diffForm.controls.modifiedText.value,
      modifiedText: this.diffForm.controls.originalText.value,
    });
    this.diffForm.patchValue({
      originalText: this.diffForm.controls.modifiedText.value,
      modifiedText: this.diffForm.controls.originalText.value,
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
