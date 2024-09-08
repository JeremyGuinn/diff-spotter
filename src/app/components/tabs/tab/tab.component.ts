import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixAddLine, remixFileFill, remixCloseLine } from '@ng-icons/remixicon';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconComponent],
  providers: [
    provideIcons({
      remixAddLine,
      remixFileFill,
      remixCloseLine,
    }),
  ],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent implements AfterViewInit, OnDestroy {
  @Input() title?: string;
  @Input() icon?: string;
  @Input() link?: string | string[];

  @Output() tabClose = new EventEmitter<boolean>();

  @HostBinding('class') hostClass = 'flex w-56 min-w-0 shrink';

  @ViewChild(RouterLinkActive) linkActive?: RouterLinkActive;
  @ViewChild('anchorLink') anchor?: ElementRef<HTMLAnchorElement>;

  ngAfterViewInit(): void {
    this.anchor?.nativeElement.addEventListener('auxclick', this.handleMiddleClick.bind(this));
  }

  ngOnDestroy(): void {
    this.anchor?.nativeElement.removeEventListener('auxclick', this.handleMiddleClick.bind(this));
  }

  close(active: boolean) {
    this.tabClose.emit(active);
  }

  private handleMiddleClick(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      this.close(this.linkActive?.isActive || false);
    }
  }
}
