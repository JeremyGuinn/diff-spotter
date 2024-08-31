import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import 'codemirror/mode/diff/diff';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
