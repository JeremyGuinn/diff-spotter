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

@Component({
  selector: 'app-split-image-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-image-canvas.component.html',
  styleUrls: ['./split-image-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitImageCanvasComponent implements AfterViewInit, OnChanges {
  @Input() image1Url = '';
  @Input() image2Url = '';
  @Input() zoom = 1;
  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('canvas1', { static: true }) canvas1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas2', { static: true }) canvas2!: ElementRef<HTMLCanvasElement>;

  private ctx1!: CanvasRenderingContext2D;
  private ctx2!: CanvasRenderingContext2D;
  private image1 = new Image();
  private image2 = new Image();
  private panX = 0;
  private panY = 0;

  ngAfterViewInit() {
    this.ctx1 = this.canvas1.nativeElement.getContext('2d')!;
    this.ctx2 = this.canvas2.nativeElement.getContext('2d')!;
    this.loadImages();
    this.updateCanvasSize();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.centerImages();
      this.drawImages();
    }

    if (
      (changes['image1Url'] && !changes['image1Url'].firstChange) ||
      (changes['image2Url'] && !changes['image2Url'].firstChange)
    ) {
      this.loadImages();
    }
  }

  loadImages() {
    this.image1.src = this.image1Url;
    this.image2.src = this.image2Url;

    this.image1.onload = () => {
      this.centerImages();
      this.drawImages();
    };
    this.image2.onload = () => {
      this.centerImages();
      this.drawImages();
    };
  }

  centerImages() {
    this.centerImageOnCanvas(this.image1, this.canvas1.nativeElement);
    this.centerImageOnCanvas(this.image2, this.canvas2.nativeElement);
  }

  centerImageOnCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const aspectRatio = img.width / img.height;

    let drawWidth = canvasWidth * this.zoom;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight * this.zoom;
      drawWidth = drawHeight * aspectRatio;
    }

    this.panX = (canvasWidth - drawWidth) / 2;
    this.panY = 0;
  }

  drawImages() {
    this.clearCanvases();
    this.drawImageOnCanvas(this.ctx1, this.image1, this.canvas1.nativeElement);
    this.drawImageOnCanvas(this.ctx2, this.image2, this.canvas2.nativeElement);
  }

  drawImageOnCanvas(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
  ) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const aspectRatio = img.width / img.height;

    let drawWidth = canvasWidth * this.zoom;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight * this.zoom;
      drawWidth = drawHeight * aspectRatio;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, this.panX, this.panY, drawWidth, drawHeight);
  }

  clearCanvases() {
    this.ctx1.clearRect(0, 0, this.canvas1.nativeElement.width, this.canvas1.nativeElement.height);
    this.ctx2.clearRect(0, 0, this.canvas2.nativeElement.width, this.canvas2.nativeElement.height);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateCanvasSize();
    this.reset();
  }

  reset() {
    this.zoom = 1;
    this.zoomChange.emit(this.zoom);
    this.centerImages();
    this.drawImages();
  }

  updateCanvasSize() {
    const parentElement1 = this.canvas1.nativeElement.parentElement;
    const parentElement2 = this.canvas2.nativeElement.parentElement;

    if (parentElement1 && parentElement2) {
      const canvas1Element = this.canvas1.nativeElement;
      const canvas2Element = this.canvas2.nativeElement;

      canvas1Element.width = parentElement1.offsetWidth;
      canvas1Element.height = parentElement1.offsetHeight;

      canvas2Element.width = parentElement2.offsetWidth;
      canvas2Element.height = parentElement2.offsetHeight;
    }
  }

  onZoom(event: WheelEvent) {
    const zoomIntensity = 0.1;
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const newZoom = this.zoom + zoomIntensity * zoomDirection;

    this.zoom = Math.max(0.1, Math.min(newZoom, 3));
    this.zoomChange.emit(this.zoom);
    this.centerImages();
    this.drawImages();
  }

  onPan(event: MouseEvent) {
    if (event.buttons !== 1) return;

    this.panX += event.movementX;
    this.panY += event.movementY;

    this.drawImages();
  }
}
