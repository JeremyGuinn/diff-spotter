import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixExpandLeftRightLine } from '@ng-icons/remixicon';

@Component({
  selector: 'app-image-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      remixExpandLeftRightLine,
    }),
  ],
  templateUrl: './image-overlay.component.html',
  styleUrls: ['./image-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageOverlayComponent {
  @Input() image1Src: string = '';
  @Input() image2Src: string = '';

  @ViewChild('image1') image1!: ElementRef<HTMLImageElement>;
  @ViewChild('image2') image2!: ElementRef<HTMLImageElement>;

  sliderValue = 50;
}
