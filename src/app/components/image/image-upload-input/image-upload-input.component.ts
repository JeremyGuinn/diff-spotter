import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
} from '@angular/core';
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

  @ViewChild('dropZone') dropZone: ElementRef<HTMLElement> | undefined;

  @HostListener('dragenter', ['$event'])
  addDragOverClass(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    console.log('drag enter');

    this.dropZone?.nativeElement.classList.add('drag-over');
  }

  @HostListener('dragleave', ['$event'])
  removeDragOverClass(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone?.nativeElement.classList.remove('drag-over');
  }

  @HostListener('dragover', ['$event'])
  @HostListener('drop', ['$event'])
  allowFileDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      this.fileUpload.emit(file);
    }
  }

  handleFileUpload(files: FileList) {
    this.fileUpload.emit(files?.item(0) || null);
  }
}
