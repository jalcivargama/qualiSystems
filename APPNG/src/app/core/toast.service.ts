import { Injectable, signal } from "@angular/core";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    title: string;
    message?: string;
    type: ToastType;
    duration: number;
    closing?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private readonly _toasts = signal<Toast[]>([]);
    private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
    private nextId = 0;

    readonly toasts = this._toasts.asReadonly();

    show(
        title: string,
        message?: string,
        type: ToastType = 'info',
        duration: number = 4000
    ): void {
        const id = this.nextId++;

        this._toasts.update(toasts => [
            ...toasts,
            { id, title, message, type, duration }
        ]);

        if (duration > 0) {
            const timer = setTimeout(() => this.dismiss(id), duration);
            this.timers.set(id, timer);
        }
    }

    success(title: string, message?: string, duration = 4000): void {
        this.show(title, message, 'success', duration);
    }

    error(title: string, message?: string, duration = 4000): void {
        this.show(title, message, 'error', duration);
    }

    warning(title: string, message?: string, duration = 4000): void {
        this.show(title, message, 'warning', duration);
    }

    info(title: string, message?: string, duration = 4000): void {
        this.show(title, message, 'info', duration);
    }

    dismiss(id: number): void {
        const toast = this._toasts().find(t => t.id === id);

        if (!toast || toast.closing) return;

        const timer = this.timers.get(id);

        if (timer !== undefined) {
            clearTimeout(timer);
            this.timers.delete(id);
        }

        this._toasts.update(toasts =>
            toasts.map(t => t.id === id ? { ...t, closing: true } : t)
        );

        const removalTimer = setTimeout(() => {
            this._toasts.update(toasts => toasts.filter(t => t.id !== id));
        }, 250);

        this.timers.set(id, removalTimer);
    }

    clear(): void {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }

        this.timers.clear();
        this._toasts.set([]);
    }
}
