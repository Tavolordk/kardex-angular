import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAuth } from './app/features/auth/auth.providers';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideAuth()]
}).catch(error => console.error(error));
