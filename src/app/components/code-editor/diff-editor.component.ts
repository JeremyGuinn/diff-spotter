import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';

import { DiffEditor } from '@acrodata/code-editor';

@Component({
  selector: 'app-diff-editor',
  standalone: true,
  template: ``,
  styles: `
    :host {
      --diff-editor-min-height: auto;
    }

    .diff-editor {
      display: block;

      .cm-mergeView,
      .cm-mergeViewEditors {
        height: 100%;
      }

      .cm-mergeView .cm-editor,
      .cm-mergeView .cm-scroller {
        height: 100% !important;
      }

      .cm-scroller {
        min-height: var(--diff-editor-min-height);
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffEditorComponent
  extends DiffEditor
  implements OnChanges, OnInit, OnDestroy
{
  @Input() minHeight?: string;

  constructor(private elementRef: ElementRef) {
    super(elementRef);
  }

  override ngOnChanges(changes: SimpleChanges): void {
    const staticSettings = [
      'originalExtensions',
      'modifiedExtensions',
      'setup',
    ];
    const staticSettingsUpdated = Object.entries(changes).some(
      ([key, value]) => staticSettings.includes(key) && !value.firstChange
    );
    if (staticSettingsUpdated) {
      this.ngOnDestroy();
      this.ngOnInit();
    }

    if (changes['minHeight']) {
      (this.elementRef.nativeElement as HTMLElement).style.setProperty(
        '--diff-editor-min-height',
        this.minHeight ?? 'auto'
      );
    }

    super.ngOnChanges(changes);
  }
}
