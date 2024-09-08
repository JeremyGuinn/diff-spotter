import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixFileAddLine,
  remixShareForwardBoxLine,
  remixSaveLine,
  remixAddCircleFill,
  remixIndeterminateCircleFill,
  remixArrowLeftRightFill,
  remixSoundModuleLine,
  remixHistoryLine,
  remixArrowDownLine,
  remixUploadLine,
} from '@ng-icons/remixicon';
import { materialDark, materialLight } from '@uiw/codemirror-theme-material';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ThemeService } from '../../services/theme.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  map,
  ReplaySubject,
  shareReplay,
  startWith,
  tap,
} from 'rxjs';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { DiffEditorComponent } from '../../components/code-editor/diff-editor.component';
import { MergeView, unifiedMergeView } from '@codemirror/merge';
import { calculateLinesRemovedAndAdded } from '@lib/diffs';
import { CopyButtonComponent } from '../../components/copy-button/copy-button.component';

import { language } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { javascript } from '@codemirror/lang-javascript';
import { htmlLanguage, html } from '@codemirror/lang-html';
import { cleanMultilineString } from '@lib/strings';
import { TextDiffSettings } from '@app/services/diffs';

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
      remixSoundModuleLine,
      remixHistoryLine,
      remixArrowDownLine,
      remixUploadLine,
    }),
  ],
  templateUrl: './text-diff.component.html',
  styleUrl: './text-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDiffComponent {
  @Input() set showDiff(showDiff: boolean) {
    if (showDiff) {
      this.syncDocsWithDiff();
    } else {
      this.liveDiff.reset();
    }
  }

  @Input() set texts(texts: { originalText: string; modifiedText: string }) {
    if (!texts) return;

    this.diffForm.patchValue({
      originalText: texts.originalText ?? '',
      modifiedText: texts.modifiedText ?? '',
    });
  }
  @Input() set settings(settings: TextDiffSettings) {
    if (settings) {
      this.diffSettings.patchValue({
        liveEdit: settings.liveEdit,
        unifiedDiff: settings.unifiedDiff,
        collapseLines: settings.collapseLines,
        language: settings.language,
        highlightMode: settings.highlightMode,
      });
    }
  }

  @Output() textsChange = new EventEmitter<{
    originalText: string;
    modifiedText: string;
  }>();
  @Output() diffChange = new EventEmitter<void>();
  @Output() settingsChange = new EventEmitter<TextDiffSettings>();

  protected readonly EditorState = EditorState;
  protected readonly EditorView = EditorView;
  protected readonly unifiedMergeView = unifiedMergeView;
  protected readonly languages = languages;

  protected readonly changeDetector = inject(ChangeDetectorRef);
  protected readonly document = inject(DOCUMENT);
  protected readonly themeService = inject(ThemeService);

  diffMergeView = new ReplaySubject<MergeView>(1);
  activeTab = signal<'history' | 'settings'>('settings');
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

  editorTheme = this.themeService.getTheme().pipe(
    map(theme => (theme === 'dark' ? materialDark : materialLight)),
    // Theme changes may occur outside of Angular's zone, due to the menu option, so we need to trigger change detection manually
    tap(() => setTimeout(() => this.changeDetector.detectChanges())),
    shareReplay(1),
  );

  diffSettings = new FormGroup({
    liveEdit: new FormControl<boolean>(false, { nonNullable: true }),
    unifiedDiff: new FormControl<boolean>(false, { nonNullable: true }),
    collapseLines: new FormControl<boolean>(false, { nonNullable: true }),
    language: new FormControl<string>('text', { nonNullable: true }),
    highlightMode: new FormControl<'line' | 'character'>('character', {
      nonNullable: true,
    }),
  });

  diffForm = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
  });

  /* This form is used to render the diff output, and is intentionally separate
     to prevent the editor cursor from jumping on every change */
  liveDiff = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
  });

  diffExtensions = combineLatest({
    editable: this.diffSettings.controls.liveEdit.valueChanges.pipe(
      startWith(this.diffSettings.controls.liveEdit.value),
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
    shareReplay(1),
  );

  unifiedDiffExtensions = combineLatest({
    collapseLines: this.diffSettings.controls.collapseLines.valueChanges.pipe(
      startWith(this.diffSettings.controls.collapseLines.value),
    ),
    originalValue: this.diffForm.controls.originalText.valueChanges.pipe(
      startWith(this.diffForm.controls.originalText.value),
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
        collapseUnchanged: collapseLines ? { margin: 3, minSize: 4 } : undefined,
      }),
    ]),
  );

  diffStats = combineLatest({
    view: this.diffMergeView.pipe(
      filter(view => !!view),
      startWith(null),
    ),
    originalText: this.diffForm.controls.originalText.valueChanges.pipe(
      startWith(this.diffForm.controls.originalText.value),
    ),
    modifiedText: this.diffForm.controls.modifiedText.valueChanges.pipe(
      startWith(this.diffForm.controls.modifiedText.value),
    ),
  }).pipe(
    delay(0),
    map(({ view }) => {
      const originalText = this.diffForm.controls.originalText.value;
      const totalOriginalLines = originalText.split('\n').length;

      const modifiedText = this.diffForm.controls.modifiedText.value;
      const totalModifiedLines = modifiedText.split('\n').length;

      const { removals: chunkLinesRemoved, additions: chunkLinesAdded } =
        calculateLinesRemovedAndAdded(view?.chunks ?? [], originalText, modifiedText);

      return {
        removals: chunkLinesRemoved,
        additions: chunkLinesAdded,
        totalOriginalLines: totalOriginalLines,
        totalModifiedLines: totalModifiedLines,
      };
    }),
  );

  constructor() {
    this.diffForm.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.textsChange.emit({
        originalText: this.diffForm.value.originalText ?? '',
        modifiedText: this.diffForm.value.modifiedText ?? '',
      });
    });

    this.diffSettings.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.settingsChange.emit({
          liveEdit: this.diffSettings.value.liveEdit,
          unifiedDiff: this.diffSettings.value.unifiedDiff,
          collapseLines: this.diffSettings.value.collapseLines,
          highlightMode: this.diffSettings.value.highlightMode,
          language: this.diffSettings.value.language,
        });
      });

    this.diffSettings.controls.liveEdit.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(liveEdit => !!liveEdit),
      )
      .subscribe(() => this.syncDocsWithDiff());
  }

  @HostListener('dragover', ['$event'])
  @HostListener('drop', ['$event'])
  allowFileDrop(e: DragEvent): void {
    const editor = e.target instanceof HTMLElement && e.target.closest('app-code-editor');
    if (editor) {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const controlKey = editor.getAttribute('data-control') as 'originalText' | 'modifiedText';
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
    this.syncDocsWithDiff();
  }

  swapTexts() {
    this.diffForm.patchValue({
      originalText: this.diffForm.controls.modifiedText.value,
      modifiedText: this.diffForm.controls.originalText.value,
    });
    this.syncDocsWithDiff();
  }

  clear(): void {
    this.diffSettings.patchValue({ liveEdit: false }, { emitEvent: false });
    this.diffForm.patchValue({ originalText: '', modifiedText: '' });
    this.syncDocsWithDiff();
  }

  print(): void {
    window.print();
  }

  syncDocsWithDiff() {
    this.liveDiff.patchValue({
      originalText: this.diffForm.controls.originalText.value,
      modifiedText: this.diffForm.controls.modifiedText.value,
    });

    this.diffChange.emit();
  }

  sortLines() {
    const originalText = this.diffForm.controls.originalText.value;
    const modifiedText = this.diffForm.controls.modifiedText.value;

    this.diffForm.patchValue({
      originalText: originalText.split('\n').sort().join('\n'),
      modifiedText: modifiedText.split('\n').sort().join('\n'),
    });
    this.syncDocsWithDiff();
  }

  toLowerCase() {
    const originalText = this.diffForm.controls.originalText.value;
    const modifiedText = this.diffForm.controls.modifiedText.value;

    this.diffForm.patchValue({
      originalText: originalText.toLowerCase(),
      modifiedText: modifiedText.toLowerCase(),
    });
    this.syncDocsWithDiff();
  }

  replaceLineBreaks() {
    const originalText = this.diffForm.controls.originalText.value;
    const modifiedText = this.diffForm.controls.modifiedText.value;

    this.diffForm.patchValue({
      originalText: originalText.replace(/\n/g, ' '),
      modifiedText: modifiedText.replace(/\n/g, ' '),
    });
    this.syncDocsWithDiff();
  }

  trimWhitespace() {
    const originalText = this.diffForm.controls.originalText.value;
    const modifiedText = this.diffForm.controls.modifiedText.value;

    // remove duplicate line breaks, but keep single line breaks
    // remove duplicate spaces, but keep single spaces, unless it's at the beginning or end of a line

    this.diffForm.patchValue({
      originalText: cleanMultilineString(originalText),
      modifiedText: cleanMultilineString(modifiedText),
    });
    this.syncDocsWithDiff();
  }

  private loadFileText(file: File, control: FormControl): void {
    const reader = new FileReader();
    reader.onload = () => control.setValue(reader.result);
    reader.readAsText(file);
  }
}
