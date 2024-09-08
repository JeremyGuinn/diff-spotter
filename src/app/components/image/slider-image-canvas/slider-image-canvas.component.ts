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
  @Input() baseImageUrl = '';
  @Input() overlayImageUrl = '';
  @Input() zoom = 1;
  @Input() sliderValue = 0.5;

  @Output() zoomChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() sliderValueChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private svgIconImage: HTMLImageElement | null = null;

  private ctx!: CanvasRenderingContext2D;
  private baseImage = new Image();
  private overlayImage = new Image();
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
    this.loadImages();
    this.loadSVGIcon();
    this.updateCanvasSize();
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
      (changes['baseImageUrl'] && !changes['baseImageUrl'].firstChange) ||
      (changes['overlayImageUrl'] && !changes['overlayImageUrl'].firstChange)
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

  loadSVGIcon() {
    const svgImage = new Image();
    const svgBlob = new Blob([remixExpandLeftRightLine], { type: 'image/svg+xml' });
    const svgURL = URL.createObjectURL(svgBlob);

    svgImage.onload = () => {
      this.svgIconImage = svgImage;
      URL.revokeObjectURL(svgURL);
      this.drawImages();
    };

    svgImage.src = svgURL;
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
    // Draw the base image
    const { drawWidth, drawHeight } = this.drawImageOnCanvas(
      this.baseImage,
      this.sliderValue,
      false,
    );
    this.baseDrawWidth = drawWidth;
    this.baseDrawHeight = drawHeight;

    // Draw the overlay image with the same dimensions
    this.drawImageOnCanvas(this.overlayImage, this.sliderValue, true, drawWidth, drawHeight);

    // Draw the slider
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

    // scale based on zoom
    drawWidth *= this.zoom;
    drawHeight *= this.zoom;

    // Center the image on the canvas
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

    // Calculate the image dimensions based on the canvas size and image aspect ratio
    let drawWidth = baseDrawWidth || canvasWidth;
    let drawHeight = baseDrawHeight || drawWidth / (img.width / img.height);

    // Ensure the image fits within the canvas bounds
    if (drawHeight > canvasHeight) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * (img.width / img.height);
    }

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);

    if (isOverlay) {
      // Clip the overlay image to the right part based on slider value
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
      // Clip the base image to the left part based on slider value
      this.ctx.beginPath();
      this.ctx.rect(this.panX, this.panY, drawWidth * sliderValue, drawHeight);
      this.ctx.clip();
    }

    // Draw the image without any scaling (scaling is applied later)
    this.ctx.drawImage(img, this.panX, this.panY, drawWidth, drawHeight);
    this.ctx.restore();

    return { drawWidth, drawHeight }; // Return dimensions for consistent overlay drawing
  }

  drawSlider(drawWidth: number, drawHeight: number) {
    const sliderX = this.panX + drawWidth * this.sliderValue; // Calculate the slider position without zoom

    // Draw the 1-pixel-wide slider line
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.fillStyle = this.sliderColor;
    this.ctx.fillRect(
      sliderX - this.sliderWidth / this.zoom / 2,
      this.panY,
      this.sliderWidth / this.zoom,
      drawHeight,
    );

    // Draw the circle at the center of the slider
    const circleCenterY = this.panY + drawHeight / 2;
    this.ctx.beginPath();
    this.ctx.arc(sliderX, circleCenterY, this.circleRadius / this.zoom, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();

    // Draw the cached SVG icon inside the circle, if it has been loaded
    if (this.svgIconImage) {
      const iconSize = this.circleRadius / this.zoom; // Size of the icon
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

    // Adjust for zoom when calculating the mouse position
    const adjustedMouseX = (mouseX - rect.left) / this.zoom;

    // Calculate slider value relative to the base image's unscaled position
    this.sliderValue = (adjustedMouseX - this.panX) / this.baseDrawWidth;
    this.sliderValue = Math.max(0, Math.min(1, this.sliderValue)); // Clamp between 0 and 1

    // Redraw the images and slider after updating the position
    this.drawImages();
  }

  isOverSlider(mouseX: number): boolean {
    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();

    // Adjust the mouse position to account for the zoom factor
    const adjustedMouseX = (mouseX - rect.left) / this.zoom;

    // Calculate the slider's position on the canvas
    const sliderX = this.panX + this.baseDrawWidth * this.sliderValue;

    console.log(
      {
        canvasElement,
        rect,
        rectLeft: rect.left,
        mouseX,
        adjustedMouseX,
        sliderX,
        circleRadius: this.circleRadius,
        zoom: this.zoom,
        panX: this.panX,
        baseDrawWidth: this.baseDrawWidth,
        sliderValue: this.sliderValue,
      },
      Math.abs(adjustedMouseX - sliderX) <= this.circleRadius / this.zoom,
    );

    // Check if the mouse is within the circle radius of the slider
    return Math.abs(adjustedMouseX - sliderX) <= this.circleRadius / this.zoom;
  }
}
