import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
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
} from '@ng-icons/remixicon';
import { CodeEditor, DiffEditor } from '@acrodata/code-editor';
import { materialDark, materialLight } from '@uiw/codemirror-theme-material';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ThemeService } from '../../services/theme.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIconComponent,
    CodeEditor,
    DiffEditor,
  ],
  providers: [
    provideIcons({
      remixFileAddLine,
      remixShareForwardBoxLine,
      remixSaveLine,
    }),
  ],
  templateUrl: './text-diff.component.html',
  styleUrl: './text-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDiffComponent {
  protected readonly EditorState = EditorState;
  protected readonly EditorView = EditorView;

  protected readonly document = inject(DOCUMENT);
  protected readonly themeService = inject(ThemeService);

  protected readonly theme = toSignal(this.themeService.getTheme());
  protected readonly editorTheme = computed(() =>
    this.theme() === 'dark' ? materialDark : materialLight
  );

  diffForm = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
    liveEdit: new FormControl<boolean>(false, { nonNullable: true }),
    unifiedDiff: new FormControl<boolean>(false, { nonNullable: true }),
    collapseLines: new FormControl<boolean>(false, { nonNullable: true }),
  });

  liveDiff = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
  });

  showDiff = signal(false);

  constructor() {
    /* 
      when the live edit is disabled, update the main form with the live diff form values,
      we do this instead of the main form values to avoid the editor from jumping the cursor 
    */
    this.diffForm.controls.liveEdit.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.diffForm.controls.liveEdit.value) {
          this.diffForm.controls.originalText.setValue(
            this.liveDiff.controls.originalText.value
          );
          this.diffForm.controls.modifiedText.setValue(
            this.liveDiff.controls.modifiedText.value
          );
        }
      });

    /* 
      These actions change the editor settings that cannot be changed dynamically
      so we destroy and recreate the editor to apply the changes 
    */
    merge(
      this.themeService.getTheme(),
      this.diffForm.controls.liveEdit.valueChanges
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.showDiff.set(!this.showDiff());
        setTimeout(() => this.showDiff.set(!this.showDiff()));
      });
  }

  @HostListener('dragover', ['$event'])
  allowFileDrop(e: DragEvent): void {
    if (e.target instanceof HTMLElement && e.target.closest('code-editor')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  renderRevertControl(): HTMLElement {
    const revertControl = this.document.createElement('div');
    revertControl.innerHTML = `
      <button class="revert-control" title="Revert changes">
        <ng-icon name="remixFileAddLine"></ng-icon>
      </button>
    `;
    return revertControl;
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
    this.diffForm.patchValue(
      {
        originalText: '',
        modifiedText: '',
        liveEdit: false,
      },
      { emitEvent: false }
    );
    this.liveDiff.patchValue({
      originalText: '',
      modifiedText: '',
    });
    this.showDiff.set(false);
  }
}
