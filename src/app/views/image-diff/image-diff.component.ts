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
import { ImageDiff } from '@app/services/diffs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixArrowLeftRightFill,
  remixDownload2Line,
  remixFileAddLine,
  remixImageFill,
  remixLoader4Line,
  remixLoopRightLine,
  remixZoomInFill,
  remixZoomOutFill,
} from '@ng-icons/remixicon';
import { getImageElementFromUrl, getImageSrc } from '@lib/images';
import { SplitImageCanvasComponent } from '../../components/image/split-image-canvas/split-image-canvas.component';
import { OverlayImageCanvasComponent } from '../../components/image/overlay-image-canvas/overlay-image-canvas.component';
import { SliderImageCanvasComponent } from '../../components/image/slider-image-canvas/slider-image-canvas.component';
import { ImagePixelDifferenceComponent } from '../../components/image/image-pixel-difference/image-pixel-difference.component';
import { derivedAsync } from 'ngxtension/derived-async';
import { ImageHighlightDifferenceComponent } from '../../components/image/image-highlight-difference/image-highlight-difference.component';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { ImageDetailsComponent } from '../../components/image/image-details/image-details.component';

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
    NgIconComponent,
    SplitImageCanvasComponent,
    OverlayImageCanvasComponent,
    SliderImageCanvasComponent,
    ImagePixelDifferenceComponent,
    ImageHighlightDifferenceComponent,
    ImageDetailsComponent,
  ],
  providers: [
    provideIcons({
      remixArrowLeftRightFill,
      remixImageFill,
      remixFileAddLine,
      remixZoomOutFill,
      remixZoomInFill,
      remixLoopRightLine,
      remixLoader4Line,
      remixDownload2Line,
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
  }

  @Output() imagesChange = new EventEmitter<{
    original: File | null;
    modified: File | null;
  }>();

  @ViewChild(SplitImageCanvasComponent) splitImageCanvas!: SplitImageCanvasComponent;
  @ViewChild(OverlayImageCanvasComponent) overlayImageCanvas!: OverlayImageCanvasComponent;
  @ViewChild(SliderImageCanvasComponent) sliderImageCanvas!: SliderImageCanvasComponent;
  @ViewChild(ImagePixelDifferenceComponent) imagePixelDifference!: ImagePixelDifferenceComponent;

  highlightDiffImage = signal<HTMLImageElement | null>(null);

  originalFile = signal<File | null>(null);
  modifiedFile = signal<File | null>(null);

  originalImage = derivedAsync(() => {
    const file = this.originalFile();
    return file ? getImageElementFromUrl(getImageSrc(file)) : null;
  });

  modifiedImage = derivedAsync(() => {
    const file = this.modifiedFile();
    return file ? getImageElementFromUrl(getImageSrc(file)) : null;
  });

  mode: DiffMode = DiffMode.split;
  modes = Object.keys(DiffMode) as DiffMode[];
  modeIcons = {
    [DiffMode.split]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 12H13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h2.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1"></path></svg>',
    [DiffMode.fade]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><mask id="fade" width="12" height="8" x="2" y="4" maskUnits="userSpaceOnUse" style="mask-type: alpha;"><path fill="currentColor" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1"></path></mask><g fill="currentColor" mask="url(#fade)"><path d="M2 12h2V4H2z"></path><path d="M4 12h2V4H4z" opacity="0.8"></path><path d="M6 12h2V4H6z" opacity="0.6"></path><path d="M8 12h2V4H8z" opacity="0.4"></path><path d="M10 12h2V4h-2z" opacity="0.2"></path></g></svg>',
    [DiffMode.slider]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 13V3"></path><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h5V4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1"></path></svg>',
    [DiffMode.difference]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><path fill="currentColor" d="M8 5a3 3 0 0 1 0 6z"></path><path fill="currentColor" fill-rule="evenodd" d="M7.5 12H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4.5a.5.5 0 0 1 .5.5V5a3 3 0 0 0 0 6v.5a.5.5 0 0 1-.5.5" clip-rule="evenodd"></path></svg>',
    [DiffMode.highlight]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m4 9 2-2 2 2-2 2zM10 6l1-1 1 1-1 1z"></path></svg>',
    [DiffMode.details]:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" preserveAspectRatio="none"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" opacity="0.4"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.5H4M9 9.5H4"></path></svg>',
  };

  zoomLevel = 1;

  setMode(mode: DiffMode) {
    if (this.mode === mode) return;

    this.mode = mode;
    this.zoomLevel = 1;
    this.highlightDiffImage.set(null);
  }

  saveHighlightDiff() {
    saveDialog({
      defaultPath: 'highlight-diff.png',
      filters: [{ name: 'Images', extensions: ['png'] }],
    }).then(result => {
      if (result) {
        const src = this.highlightDiffImage()?.src;
        if (!src) return;

        fetch(src)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => new Uint8Array(arrayBuffer))
          .then(buffer => writeFile(result, buffer))
          .catch(console.error);
      }
    });
  }

  swapImages() {
    const originalFile = this.originalFile();
    const modifiedFile = this.modifiedFile();

    this.originalFile.set(modifiedFile);
    this.modifiedFile.set(originalFile);

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
      case DiffMode.fade:
        this.overlayImageCanvas.reset();
        break;
      case DiffMode.slider:
        this.sliderImageCanvas.reset();
        break;
      case DiffMode.difference:
        this.imagePixelDifference.reset();
    }
  }
}
