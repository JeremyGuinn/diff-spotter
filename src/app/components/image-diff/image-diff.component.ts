import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ImageUploadInputComponent } from '../image-upload-input/image-upload-input.component';
import { ImageUploadPreviewComponent } from '../image-upload-preview/image-upload-preview.component';
import { parse as parseExif } from 'exifr';
import { ImageOverlayComponent } from '../image-overlay/image-overlay.component';
import { ImageDiff } from '@app/services/diffs';
@Component({
  selector: 'app-image-diff',
  standalone: true,
  imports: [
    CommonModule,
    ImageUploadInputComponent,
    ImageUploadPreviewComponent,
    ImageOverlayComponent,
  ],
  templateUrl: './image-diff.component.html',
  styleUrl: './image-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDiffComponent {
  @Input() set images(images: ImageDiff['data']) {
    if (!images) return;

    this.originalFile.set(images.originalFile);
    this.modifiedFile.set(images.modifiedFile);

    this.originalFileSrc.set(
      images.originalSrc || this.getSrc(images.originalFile)
    );
    this.modifiedFileSrc.set(
      images.modifiedSrc || this.getSrc(images.modifiedFile)
    );
  }

  @Output() imagesChange = new EventEmitter<{
    original: File | null;
    modified: File | null;
  }>();

  originalFile = signal<File | null>(null);
  modifiedFile = signal<File | null>(null);

  originalFileSrc = signal<string>('');
  modifiedFileSrc = signal<string>('');

  original = computed(() => {
    const file = this.originalFile();

    if (!file) return null;

    const image = new Image();
    image.src = this.getSrc(file);

    return {
      src: this.getSrc(file),
      exif: parseExif(file),
      file,
      width: image.width,
      height: image.height,
      aspectRatio: image.width / image.height,
    };
  });

  modified = computed(() => {
    const file = this.modifiedFile();
    if (!file) return null;

    const image = new Image();
    image.src = this.getSrc(file);

    return {
      src: this.getSrc(file),
      exif: parseExif(file),
      file,
      width: image.width,
      height: image.height,
      aspectRatio: image.width / image.height,
    };
  });

  maxHeight = computed(() => {
    const original = this.original();
    const modified = this.modified();

    return Math.max(
      original ? original.height : 0,
      modified ? modified.height : 0
    );
  });

  aspectRatio = computed(() => {
    const original = this.original();
    const modified = this.modified();

    return (
      (original ? original.aspectRatio : 1) /
      (modified ? modified.aspectRatio : 1)
    );
  });

  mode: 'split' | 'fade' | 'slider' | 'difference' | 'highlight' | 'details' =
    'fade';

  handleFileUpload(file: File | null, isOriginal: boolean) {
    if (isOriginal) {
      this.originalFile.set(file);
    } else {
      this.modifiedFile.set(file);
    }

    this.imagesChange.emit({
      original: this.originalFile(),
      modified: this.modifiedFile(),
    });
  }

  handleFileRemove(isOriginal: boolean) {
    if (isOriginal) {
      this.originalFile.set(null);
    } else {
      this.modifiedFile.set(null);
    }
  }

  getSrc(file: File | null) {
    return file ? URL.createObjectURL(file) : '';
  }
}
