import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { BytesPipe } from '@app/pipes/bytes.pipe';
import { derivedAsync } from 'ngxtension/derived-async';
import ExifReader from 'exifreader';

@Component({
  selector: 'app-image-details',
  standalone: true,
  imports: [CommonModule],
  providers: [BytesPipe, DecimalPipe],
  templateUrl: './image-details.component.html',
  styleUrl: './image-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDetailsComponent {
  private readonly bypePipe = inject(BytesPipe);

  image = input.required<HTMLImageElement>();
  file = input.required<File>();

  details = derivedAsync(async () => {
    const tags = await ExifReader.load(this.file(), { async: true });

    return Object.entries({
      'file type': this.file().type,
      size: this.bypePipe.transform(this.file().size),
      height: tags.ImageHeight?.description ?? `${this.image().height}px`,
      width: tags.ImageWidth?.description ?? `${this.image().width}px`,
      'vertical resolution': this.getResolutionDescription(
        tags.YResolution?.description,
        tags.ResolutionUnit?.description,
      ),
      'horizontal resolution': this.getResolutionDescription(
        tags.XResolution?.description,
        tags.ResolutionUnit?.description,
      ),
      subsampling: tags?.['Subsampling']?.description,
      make: tags?.Make?.description,
      model: tags.Model?.description,
      orientation: tags.Orientation?.description,
      'date and time':
        tags.DateTime?.description ??
        tags.DateTimeOriginal?.description ??
        tags.DateTimeDigitized?.description,
      saturation: tags?.Saturation?.description,
      sharpness: tags?.Sharpness?.description,
      contrast: tags?.Contrast?.description,
    });
  });

  private getResolutionDescription(resolution?: string, unit?: string) {
    if (unit === 'inches') {
      unit = 'dpi';
    }

    return resolution && unit ? `${resolution} ${unit}` : resolution;
  }
}
