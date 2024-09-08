import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixCloseLine, remixImageFill } from '@ng-icons/remixicon';
import { BytesPipe } from '../../pipes/bytes.pipe';

@Component({
  selector: 'app-image-upload-preview[file]',
  standalone: true,
  imports: [CommonModule, NgIconComponent, BytesPipe],
  providers: [
    provideIcons({
      remixImageFill,
      remixCloseLine,
    }),
    BytesPipe,
    DecimalPipe,
  ],
  templateUrl: './image-upload-preview.component.html',
  styleUrl: './image-upload-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadPreviewComponent {
  @Input() file!: File;
  @Output() remove = new EventEmitter<void>();

  getPreview() {
    return URL.createObjectURL(this.file);
  }
}
