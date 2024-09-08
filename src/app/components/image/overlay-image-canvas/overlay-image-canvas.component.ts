import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
  AfterViewInit,
  EventEmitter,
  HostListener,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixExpandLeftRightLine } from '@ng-icons/remixicon';

@Component({
  selector: 'app-overlay-image-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      remixExpandLeftRightLine,
    }),
  ],
  templateUrl: './overlay-image-canvas.component.html',
  styleUrls: ['./overlay-image-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayImageCanvasComponent implements AfterViewInit, OnChanges {
  @Input() baseImageUrl = '';
  @Input() overlayImageUrl = '';
  @Input() zoom = 1;
  @Input() overlayOpacity = 0.5;

  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() overlayOpacityChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private baseImage = new Image();
  private overlayImage = new Image();
  private panX = 0;
  private panY = 0;

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.loadImages();
    this.updateCanvasSize();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.drawImages();
    }
    if (changes['overlayOpacity'] && !changes['overlayOpacity'].firstChange) {
      this.drawImages();
    }
    if (
      (changes['baseImageUrl'] && !changes['baseImageUrl'].firstChange) ||
      (changes['overlayImageUrl'] && !changes['overlayImageUrl'].firstChange)
    ) {
      this.loadImages();
    }
  }

  loadImages() {
    this.baseImage.src = this.baseImageUrl;
    this.overlayImage.src = this.overlayImageUrl;

    this.baseImage.onload = () => {
      this.centerImageOnCanvas();
      this.drawImages();
    };

    this.overlayImage.onload = () => {
      this.drawImages();
    };
  }

  centerImageOnCanvas() {
    const canvasWidth = this.canvas.nativeElement.width;
    const canvasHeight = this.canvas.nativeElement.height;
    const aspectRatio = this.baseImage.width / this.baseImage.height;

    let drawWidth = canvasWidth * this.zoom;
    let drawHeight = drawWidth / aspectRatio;

    drawHeight -= 40;
    drawWidth = drawHeight * aspectRatio;

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight * this.zoom;
      drawWidth = drawHeight * aspectRatio;
    }

    this.panX = (canvasWidth - drawWidth) / 2;
    this.panY = 40;

    this.drawImages();
  }

  drawImages() {
    this.clearCanvas();

    const { drawWidth, drawHeight } = this.drawImageOnCanvas(this.baseImage, 1, false);

    this.drawImageOnCanvas(this.overlayImage, this.overlayOpacity, true, drawWidth, drawHeight);
  }

  drawImageOnCanvas(
    img: HTMLImageElement,
    opacity: number,
    stretchToBase: boolean,
    baseDrawWidth?: number,
    baseDrawHeight?: number,
  ) {
    const canvasWidth = this.canvas.nativeElement.width;
    const canvasHeight = this.canvas.nativeElement.height;
    let drawWidth, drawHeight;

    if (stretchToBase && baseDrawWidth && baseDrawHeight) {
      drawWidth = baseDrawWidth;
      drawHeight = baseDrawHeight;
    } else {
      const aspectRatio = img.width / img.height;
      drawWidth = canvasWidth * this.zoom;
      drawHeight = drawWidth / aspectRatio;

      if (drawHeight > canvasHeight) {
        drawHeight = canvasHeight * this.zoom;
        drawWidth = drawHeight * aspectRatio;
      }
    }

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(img, this.panX, this.panY, drawWidth, drawHeight);
    this.ctx.restore();

    return { drawWidth, drawHeight };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
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

  updateCanvasSize() {
    const canvasElement = this.canvas.nativeElement;
    const parentElement = canvasElement.parentElement;

    if (parentElement) {
      canvasElement.width = parentElement.offsetWidth;
      canvasElement.height = parentElement.offsetHeight;
    }
  }

  onZoom(event: WheelEvent) {
    const zoomIntensity = 0.1;
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const newZoom = this.zoom + zoomIntensity * zoomDirection;

    this.zoom = Math.max(0.1, Math.min(newZoom, 3));
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

  onOpacityChange(event: Event) {
    const newOpacity = (event.target as HTMLInputElement).valueAsNumber;
    this.overlayOpacity = newOpacity;
    this.overlayOpacityChange.emit(this.overlayOpacity);
    this.drawImages();
  }
}
