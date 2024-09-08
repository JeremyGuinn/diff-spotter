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
import { getImageElementFromSvg } from '@lib/images';
import { NgIconComponent } from '@ng-icons/core';
import { remixExpandLeftRightLine } from '@ng-icons/remixicon';

@Component({
  selector: 'app-slider-image-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './slider-image-canvas.component.html',
  styleUrls: ['./slider-image-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderImageCanvasComponent implements AfterViewInit, OnChanges {
  @Input() baseImage!: HTMLImageElement;
  @Input() overlayImage!: HTMLImageElement;
  @Input() zoom = 1;
  @Input() sliderValue = 0.5;

  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() sliderValueChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private svgIconImage: HTMLImageElement | null = null;

  private ctx!: CanvasRenderingContext2D;
  private panX = 0;
  private panY = 0;
  private startX = 0;
  private startY = 0;
  private isDraggingSlider = false;

  private sliderWidth = 1;
  private sliderColor = 'rgb(0, 0, 0)';
  private circleRadius = 15;
  private baseDrawWidth!: number;
  private baseDrawHeight!: number;

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.updateCanvasSize();
    this.loadImages();
    this.loadSVGIcon();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.centerImageOnCanvas();
      this.drawImages();
    }
    if (changes['sliderValue'] && !changes['sliderValue'].firstChange) {
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

  @HostListener('mousemove', ['$event'])
  onPan(event: MouseEvent) {
    if (this.isDraggingSlider) {
      this.updateSliderPosition(event.clientX);
    } else if (event.buttons === 1) {
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;

      this.panX += deltaX;
      this.panY += deltaY;

      this.startX = event.clientX;
      this.startY = event.clientY;

      this.drawImages();
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.isOverSlider(event.clientX)) {
      this.isDraggingSlider = true;
    } else if (event.buttons === 1) {
      this.startX = event.clientX;
      this.startY = event.clientY;
    }
  }

  onMouseUp() {
    this.isDraggingSlider = false;
  }

  loadImages() {
    this.centerImageOnCanvas();
    this.drawImages();
  }

  loadSVGIcon() {
    getImageElementFromSvg(remixExpandLeftRightLine).then(img => {
      this.svgIconImage = img;
      this.drawImages();
    });
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

  drawImages() {
    this.clearCanvas();
    const { drawWidth, drawHeight } = this.drawImageOnCanvas(
      this.baseImage,
      this.sliderValue,
      false,
    );
    this.baseDrawWidth = drawWidth;
    this.baseDrawHeight = drawHeight;

    this.drawImageOnCanvas(this.overlayImage, this.sliderValue, true, drawWidth, drawHeight);

    this.drawSlider(drawWidth, drawHeight);
  }

  centerImageOnCanvas() {
    const canvasWidth = this.canvas.nativeElement.width / this.zoom;
    const canvasHeight = this.canvas.nativeElement.height / this.zoom;
    const aspectRatio = this.baseImage.width / this.baseImage.height;

    let drawWidth = canvasWidth;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * aspectRatio;
    }

    drawWidth *= this.zoom;
    drawHeight *= this.zoom;

    this.panX = (canvasWidth - drawWidth) / 2;
    this.panY = (canvasHeight - drawHeight) / 2;
  }

  drawImageOnCanvas(
    img: HTMLImageElement,
    sliderValue: number,
    isOverlay: boolean,
    baseDrawWidth?: number,
    baseDrawHeight?: number,
  ) {
    const canvasWidth = this.canvas.nativeElement.width;
    const canvasHeight = this.canvas.nativeElement.height;

    let drawWidth = baseDrawWidth || canvasWidth;
    let drawHeight = baseDrawHeight || drawWidth / (img.width / img.height);

    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * (img.width / img.height);
    }

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);

    if (isOverlay) {
      this.ctx.globalAlpha = 1;
      this.ctx.beginPath();
      this.ctx.rect(
        this.panX + drawWidth * sliderValue,
        this.panY,
        drawWidth * (1 - sliderValue),
        drawHeight,
      );
      this.ctx.clip();
    } else {
      this.ctx.beginPath();
      this.ctx.rect(this.panX, this.panY, drawWidth * sliderValue, drawHeight);
      this.ctx.clip();
    }

    this.ctx.drawImage(img, this.panX, this.panY, drawWidth, drawHeight);
    this.ctx.restore();

    return { drawWidth, drawHeight };
  }

  drawSlider(drawWidth: number, drawHeight: number) {
    const sliderX = this.panX + drawWidth * this.sliderValue;

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.fillStyle = this.sliderColor;
    this.ctx.fillRect(
      sliderX - this.sliderWidth / this.zoom / 2,
      this.panY,
      this.sliderWidth / this.zoom,
      drawHeight,
    );

    const circleCenterY = this.panY + drawHeight / 2;
    this.ctx.beginPath();
    this.ctx.arc(sliderX, circleCenterY, this.circleRadius / this.zoom, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();

    if (this.svgIconImage) {
      const iconSize = this.circleRadius / this.zoom;
      this.ctx.drawImage(
        this.svgIconImage,
        sliderX - iconSize / 2,
        circleCenterY - iconSize / 2,
        iconSize,
        iconSize,
      );
    }

    this.ctx.restore();
  }

  updateSliderPosition(mouseX: number) {
    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();
    const adjustedMouseX = (mouseX - rect.left) / this.zoom;

    this.sliderValue = (adjustedMouseX - this.panX) / this.baseDrawWidth;
    this.sliderValue = Math.max(0, Math.min(1, this.sliderValue));

    this.drawImages();
  }

  isOverSlider(mouseX: number): boolean {
    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();
    const adjustedMouseX = (mouseX - rect.left) / this.zoom;
    const sliderX = this.panX + this.baseDrawWidth * this.sliderValue;

    return Math.abs(adjustedMouseX - sliderX) <= this.circleRadius / this.zoom;
  }
}
