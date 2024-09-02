import { CodeEditor } from '@acrodata/code-editor';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
  OnInit,
  HostBinding,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { Annotation, Extension } from '@codemirror/state';

export type Theme = 'light' | 'dark' | Extension;
export type Setup = 'basic' | 'minimal' | null;

export const External = Annotation.define<boolean>();

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: ``,
  styles: `
    :host {
      --code-editor-min-height: auto;
    }

    .code-editor {
      display: block;

      .cm-editor {
        height: 100%;
      }
      .cm-scroller {
        min-height: var(--code-editor-min-height);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeEditorComponent),
      multi: true,
    },
  ],
})
export class CodeEditorComponent
  extends CodeEditor
  implements OnChanges, OnInit
{
  @HostBinding('class') hostClass = 'code-editor';
  @Input() minHeight?: string;

  constructor(private elementRef: ElementRef) {
    super(elementRef);
  }

  override ngOnChanges(changes: SimpleChanges): void {
    const staticSettings = ['languages'];
    const staticSettingsUpdated = Object.entries(changes).some(
      ([key, value]) => staticSettings.includes(key) && !value.firstChange
    );
    if (staticSettingsUpdated) {
      this.ngOnDestroy();
      this.ngOnInit();
    }

    if (changes['minHeight']) {
      (this.elementRef.nativeElement as HTMLElement).style.setProperty(
        '--code-editor-min-height',
        this.minHeight ?? 'auto'
      );
    }

    super.ngOnChanges(changes);
  }
}
