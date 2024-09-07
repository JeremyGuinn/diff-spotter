import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { DiffMethod } from '@app/services/diffs';

@Component({
  selector: 'app-new-diff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-diff.component.html',
  styleUrl: './new-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewDiffComponent {
  @Output() methodSelect = new EventEmitter<DiffMethod>();

  protected readonly DiffMethod = DiffMethod;
}
