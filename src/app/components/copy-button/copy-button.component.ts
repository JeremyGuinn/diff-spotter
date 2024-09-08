import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [ngClass]="classes" (click)="copyText()" [disabled]="disabled()">
      {{ buttonText() }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  @Input() text?: string;
  @Input() classes?: string = 'btn btn-sm btn-ghost';

  disabled = signal(false);
  buttonText = signal('Copy');

  copyText() {
    if (this.text) {
      navigator.clipboard.writeText(this.text);
    }

    this.buttonText.set('Copied!');
    this.disabled.set(true);

    setTimeout(() => {
      this.buttonText.set('Copy');
      this.disabled.set(false);
    }, 1000);
  }
}
