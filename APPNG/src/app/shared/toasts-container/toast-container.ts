import { Component, effect, inject } from '@angular/core';
import { ToastService, ToastType } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainer {

  readonly toastService = inject(ToastService);

  readonly icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };
}