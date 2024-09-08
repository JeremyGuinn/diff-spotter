import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TextDiffComponent } from './views/text-diff/text-diff.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { DiffComponent } from './views/diff/diff.component';
import { DiffsService } from './services/diffs.service';
import { filter, map, shareReplay, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TextDiffComponent, TabsComponent, DiffComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly diffsService = inject(DiffsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  diffs = this.diffsService.getOpenDiffs();

  activeDiff$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    tap(() => window.history.pushState(null, null!, null)),
    map(() => this.route),
    map(route => {
      let child = route.firstChild;
      while (child) {
        route = child;
        child = route.firstChild;
      }
      return route;
    }),
    switchMap(route => route.params),
    map(params => params['id']),
    shareReplay(1),
  );

  @HostListener('window:dragover', ['$event'])
  preventFileDrop(e: DragEvent): void {
    if (e) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }
}
