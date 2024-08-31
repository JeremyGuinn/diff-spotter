import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import * as diff from 'diff';

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CodemirrorModule],
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDiffComponent {
  protected document = inject(DOCUMENT);

  diffForm = new FormGroup({
    originalText: new FormControl(''),
    modifiedText: new FormControl(''),
  });

  diffResult: string | null = null;

  generateDiff(): void {
    const diff = this.getDiff(
      this.diffForm.value.originalText || '',
      this.diffForm.value.modifiedText || ''
    );

    this.diffResult = diff;
  }

  getDiff(originalText: string, modifiedText: string): string {
    const diffResult = diff.createTwoFilesPatch(
      'original',
      'modified',
      originalText,
      modifiedText,
      '',
      ''
    );

    return diffResult;
  }
}
