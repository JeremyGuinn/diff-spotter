import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DiffsService, Diff, DiffMethod } from '@app/services/diffs.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  remixAddLine,
  remixArticleLine,
  remixFileLine,
  remixFileImageLine,
} from '@ng-icons/remixicon';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { map, Observable, shareReplay, take, tap } from 'rxjs';
import { TabComponent } from './tab/tab.component';

const appWindow = getCurrentWindow();

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconComponent, TabComponent],
  providers: [provideIcons({ remixAddLine })],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly diffsService = inject(DiffsService);

  protected readonly tabs: Observable<
    { title: string; diffId: string; icon: string }[]
  > = this.diffsService
    .getOpenDiffs()
    .pipe(map(this.convertToTabs.bind(this)), shareReplay(1), tap(console.log));

  icons = {
    [DiffMethod.NEW]: remixFileLine,
    [DiffMethod.TEXT]: remixArticleLine,
    [DiffMethod.IMAGE]: remixFileImageLine,
  };

  ngOnInit(): void {
    this.tabs
      .pipe(take(1))
      .subscribe(tabs => tabs.length === 0 && this.newDiff());
  }

  newDiff() {
    const newDiff = {
      diffId: crypto.randomUUID(),
      title: 'New Diff',
      left: '',
      right: '',
      method: DiffMethod.NEW,
    };
    this.diffsService.addDiff(newDiff);
    this.router.navigate(['/tabs', newDiff.diffId]);
  }

  closeDiff(diffId: string, currentlyActive: boolean) {
    // If the diff is the only one open, close the window
    // If the diff is the active one, navigate to the previous diff
    // Otherwise, remove the diff

    this.tabs.pipe(take(1)).subscribe(tabs => {
      if (tabs.length === 1) {
        appWindow.close();
        return;
      }

      this.diffsService.removeDiff(diffId);
      if (currentlyActive) {
        const currentTabIndex = tabs.findIndex(tab => tab.diffId === diffId);
        const previousTab = tabs.at(currentTabIndex - 1);
        this.router.navigate(['/tabs', previousTab!.diffId]);
      }
    });
  }

  private convertToTabs(
    diffs: Diff<unknown>[]
  ): { title: string; diffId: string }[] {
    return diffs.map(diff => ({
      title: diff.title,
      diffId: diff.diffId,
      icon: this.icons[diff.method],
    }));
  }
}
