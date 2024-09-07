import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ImageUploadInputComponent } from '../image-upload-input/image-upload-input.component';
import { ImageUploadPreviewComponent } from '../image-upload-preview/image-upload-preview.component';
import { parse as parseExif } from 'exifr';
import { ImageOverlayComponent } from '../image-overlay/image-overlay.component';
import { ImageDiff } from '@app/services/diffs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixArrowLeftRightFill,
  remixFileAddLine,
  remixImageFill,
} from '@ng-icons/remixicon';
import { getImageSrc } from '@lib/images';

enum DiffMode {
  'split' = 'split',
  'fade' = 'fade',
  'slider' = 'slider',
  'difference' = 'difference',
  'highlight' = 'highlight',
  'details' = 'details',
}

@Component({
  selector: 'app-image-diff',
  standalone: true,
  imports: [
    CommonModule,
    ImageUploadInputComponent,
    ImageUploadPreviewComponent,
    ImageOverlayComponent,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      remixArrowLeftRightFill,
      remixImageFill,
      remixFileAddLine,
    }),
  ],
  templateUrl: './image-diff.component.html',
  styleUrl: './image-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDiffComponent {
  private readonly document = inject(DOCUMENT);

  @Input() set images(images: ImageDiff['data']) {
    if (!images) return;

    this.originalFile.set(images.originalFile);
    this.modifiedFile.set(images.modifiedFile);

    this.originalFileSrc.set(
      images.originalSrc || getImageSrc(images.originalFile)
    );
    this.modifiedFileSrc.set(
      images.modifiedSrc || getImageSrc(images.modifiedFile)
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
    image.src = getImageSrc(file);

    return {
      src: getImageSrc(file),
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
    image.src = getImageSrc(file);

    return {
      src: getImageSrc(file),
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

  mode: DiffMode = DiffMode.fade;
  modes = Object.keys(DiffMode) as DiffMode[];

  swapImages() {
    const originalFile = this.originalFile();
    const originalSrc = this.originalFileSrc();
    const modifiedFile = this.modifiedFile();
    const modifiedSrc = this.modifiedFileSrc();

    this.originalFile.set(modifiedFile);
    this.modifiedFile.set(originalFile);

    this.originalFileSrc.set(modifiedSrc);
    this.modifiedFileSrc.set(originalSrc);

    this.imagesChange.emit({
      original: modifiedFile,
      modified: originalFile,
    });
  }

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

  openFile(target: 'original' | 'modified') {
    const input = this.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.handleFileUpload(file, target === 'original');
      }
    });
    input.click();
  }
}
