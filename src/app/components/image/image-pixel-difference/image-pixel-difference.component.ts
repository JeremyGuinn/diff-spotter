import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  HostListener,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-pixel-difference',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-pixel-difference.component.html',
  styleUrls: ['./image-pixel-difference.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePixelDifferenceComponent implements AfterViewInit, OnChanges {
  @Input() baseImage!: HTMLImageElement;
  @Input() overlayImage!: HTMLImageElement;
  @Input() zoom = 1;

  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private panX = 0;
  private panY = 0;
  private baseDrawWidth!: number;
  private baseDrawHeight!: number;
  private diffImage?: HTMLImageElement;

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.updateCanvasSize();
    this.loadImages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.centerImageOnCanvas();
      this.drawImages();
    }

    if (
      (changes['baseImage'] && !changes['baseImage'].firstChange) ||
      (changes['overlayImage'] && !changes['overlayImage'].firstChange)
    ) {
      this.loadImages();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateCanvasSize();
    this.reset();
  }

  reset() {
    this.zoom = 1;
    this.zoomChange.emit(this.zoom);
    this.centerImageOnCanvas();
    this.drawImages();
  }

  onPan(event: MouseEvent) {
    if (event.buttons === 1) {
      this.panX += event.movementX;
      this.panY += event.movementY;

      this.drawImages();
    }
  }

  loadImages() {
    this.centerImageOnCanvas();
    this.diffImage = undefined;
    this.calculatePixelDifferences();
    this.drawImages();
  }

  updateCanvasSize() {
    const canvasElement = this.canvas.nativeElement;
    const parentElement = canvasElement.parentElement;

    if (parentElement) {
      canvasElement.width = parentElement.offsetWidth;
      canvasElement.height = parentElement.offsetHeight;
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  centerImageOnCanvas() {
    const canvasWidth = this.canvas.nativeElement.width;
    const canvasHeight = this.canvas.nativeElement.height;

    const aspectRatio = this.baseImage.width / this.baseImage.height;

    let drawWidth = canvasWidth;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * aspectRatio;
    }

    this.baseDrawWidth = drawWidth;
    this.baseDrawHeight = drawHeight;

    drawWidth *= this.zoom;
    drawHeight *= this.zoom;

    this.panX = (canvasWidth - drawWidth) / 2;
    this.panY = (canvasHeight - drawHeight) / 2;
  }

  calculatePixelDifferences() {
    if (this.diffImage) {
      return;
    }

    if (!this.baseImage || !this.overlayImage) {
      console.warn('Images are not loaded.');
      return;
    }

    const baseImageData = this.getImageDataFromImage(this.baseImage);
    const overlayImageData = this.getImageDataFromImage(this.overlayImage);
    const diffImageData = this.calculatePixelDifference(baseImageData, overlayImageData);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = this.baseDrawWidth;
    tmpCanvas.height = this.baseDrawHeight;
    const tmpCtx = tmpCanvas.getContext('2d')!;

    tmpCtx.putImageData(diffImageData, 0, 0);
    const image = new Image();
    image.src = tmpCanvas.toDataURL();
    image.onload = () => {
      this.diffImage = image;
      this.drawImages();
    };
  }

  drawImages() {
    this.clearCanvas();
    if (this.diffImage) {
      this.drawImageOnCanvas(
        this.diffImage,
        this.baseDrawWidth * this.zoom,
        this.baseDrawHeight * this.zoom,
      );
    }
  }

  drawImageOnCanvas(img: HTMLImageElement, drawWidth: number, drawHeight: number) {
    this.ctx.save();
    this.ctx.drawImage(img, this.panX, this.panY, drawWidth, drawHeight);
    this.ctx.restore();
  }

  getImageDataFromImage(img: HTMLImageElement) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.baseDrawWidth;
    tempCanvas.height = this.baseDrawHeight;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.drawImage(img, 0, 0, this.baseDrawWidth, this.baseDrawHeight);

    const imageData = tempCtx.getImageData(0, 0, this.baseDrawWidth, this.baseDrawHeight);
    tempCanvas.remove();

    return imageData;
  }

  calculatePixelDifference(baseImageData: ImageData, overlayImageData: ImageData): ImageData {
    const baseArray = new Uint32Array(baseImageData.data.buffer);
    const overlayArray = new Uint32Array(overlayImageData.data.buffer);

    const diffArray = new Uint32Array(baseArray.length);

    for (let i = 0; i < baseArray.length; i++) {
      const basePixel = baseArray[i];
      const overlayPixel = overlayArray[i];

      const diffR = Math.abs((basePixel & 0xff) - (overlayPixel & 0xff));
      const diffG = Math.abs(((basePixel >> 8) & 0xff) - ((overlayPixel >> 8) & 0xff));
      const diffB = Math.abs(((basePixel >> 16) & 0xff) - ((overlayPixel >> 16) & 0xff));

      const alpha = Math.max((basePixel >> 24) & 0xff, (overlayPixel >> 24) & 0xff);

      diffArray[i] = (alpha << 24) | (diffB << 16) | (diffG << 8) | diffR;
    }

    return new ImageData(
      new Uint8ClampedArray(diffArray.buffer),
      baseImageData.width,
      baseImageData.height,
    );
  }
}
