import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { ImageUploadInputComponent } from '../../components/image/image-upload-input/image-upload-input.component';
import { ImageUploadPreviewComponent } from '../../components/image/image-upload-preview/image-upload-preview.component';
import { ImageOverlayComponent } from '../../components/image/image-overlay/image-overlay.component';
import { ImageDiff } from '@app/services/diffs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixArrowLeftRightFill,
  remixFileAddLine,
  remixImageFill,
  remixLoopRightLine,
  remixZoomInFill,
  remixZoomOutFill,
} from '@ng-icons/remixicon';
import { getImageSrc } from '@lib/images';
import { SplitImageCanvasComponent } from '../../components/image/split-image-canvas/split-image-canvas.component';

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
    SplitImageCanvasComponent,
  ],
  providers: [
    provideIcons({
      remixArrowLeftRightFill,
      remixImageFill,
      remixFileAddLine,
      remixZoomOutFill,
      remixZoomInFill,
      remixLoopRightLine,
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

    this.originalFileSrc.set(images.originalSrc || getImageSrc(images.originalFile));
    this.modifiedFileSrc.set(images.modifiedSrc || getImageSrc(images.modifiedFile));
  }

  @Output() imagesChange = new EventEmitter<{
    original: File | null;
    modified: File | null;
  }>();

  @ViewChild(SplitImageCanvasComponent) splitImageCanvas!: SplitImageCanvasComponent;

  originalFile = signal<File | null>(null);
  modifiedFile = signal<File | null>(null);

  originalFileSrc = signal<string>('');
  modifiedFileSrc = signal<string>('');

  mode: DiffMode = DiffMode.split;
  modes = Object.keys(DiffMode) as DiffMode[];
  splitZoom = 1;

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

  reset() {
    switch (this.mode) {
      case DiffMode.split:
        this.splitImageCanvas.reset();
        break;
    }
  }
}
