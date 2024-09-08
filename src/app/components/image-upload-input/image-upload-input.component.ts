import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixImageFill } from '@ng-icons/remixicon';

@Component({
  selector: 'app-image-upload-input',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      remixImageFill,
    }),
  ],
  templateUrl: './image-upload-input.component.html',
  styleUrl: './image-upload-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadInputComponent {
  @Output() fileUpload = new EventEmitter<File | null>();

  handleFileUpload(files: FileList) {
    this.fileUpload.emit(files?.item(0) || null);
  }
}
