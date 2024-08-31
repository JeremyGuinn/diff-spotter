import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { material } from '@uiw/codemirror-theme-material';
import { EditorState } from '@codemirror/state';

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
  protected document = inject(DOCUMENT);
  protected theme = material;
  protected EditorState = EditorState;

  diffForm = new FormGroup({
    originalText: new FormControl<string>('', { nonNullable: true }),
    modifiedText: new FormControl<string>('', { nonNullable: true }),
    liveEdit: new FormControl<boolean>(false, { nonNullable: true }),
    unifiedDiff: new FormControl<boolean>(false, { nonNullable: true }),
    collapseLines: new FormControl<boolean>(false, { nonNullable: true }),
  });

  showDiff: boolean = false;

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
    this.diffForm.reset();
    this.showDiff = false;
  }
}
