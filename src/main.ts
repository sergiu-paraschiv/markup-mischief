import { bootstrapApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { AppComponent } from './app/app.component';
import { EditorComponent } from './editor/components/editor/editor.component';

bootstrapApplication(AppComponent)
  .then(app => {
    const Editor = createCustomElement(EditorComponent, {
      injector: app.injector,
    });
    customElements.define('mm-editor', Editor);
  })
  .catch(err => console.error(err));
