import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { DiffMethod } from '@app/services/diffs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixFileFill, remixImageFill } from '@ng-icons/remixicon';

@Component({
  selector: 'app-new-diff',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      remixImageFill,
      remixFileFill,
    }),
  ],
  templateUrl: './new-diff.component.html',
  styleUrl: './new-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewDiffComponent {
  @Output() methodSelect = new EventEmitter<DiffMethod>();

  protected readonly DiffMethod = DiffMethod;
}
