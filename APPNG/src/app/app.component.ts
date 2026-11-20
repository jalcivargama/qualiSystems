import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/toasts-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.component.html',
})
export class App {}
