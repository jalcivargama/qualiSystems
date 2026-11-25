import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  SearchableSelectOption,
  SearchableSelectValue,
} from './searchable-select.models';

@Component({
  selector: 'app-searchable-select',
  imports: [CommonModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input<SearchableSelectOption[]>([]);
  readonly placeholder = input('Selecciona…');
  readonly searchPlaceholder = input('Buscar…');
  readonly disabledInput = input(false, { alias: 'disabled' });
  readonly clearable = input(true);
  readonly emptyLabel = input('Sin resultados');

  readonly open = signal(false);
  readonly query = signal('');
  readonly value = signal<SearchableSelectValue>(null);
  readonly disabled = signal(false);

  private onChange: (value: SearchableSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly sortedOptions = computed(() => {
    const items = [...this.options()];
    return items.sort((a, b) => {
      const groupA = (a.group ?? '').toLocaleLowerCase();
      const groupB = (b.group ?? '').toLocaleLowerCase();
      if (groupA !== groupB) return groupA.localeCompare(groupB, 'es');
      return a.label.toLocaleLowerCase().localeCompare(b.label.toLocaleLowerCase(), 'es');
    });
  });

  readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const items = this.sortedOptions();
    if (!q) return items;
    return items.filter((option) => {
      const haystack = [option.label, option.group, option.searchText]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(q);
    });
  });

  readonly selectedLabel = computed(() => {
    const current = this.value();
    if (current == null || current === '') return '';
    const match = this.options().find((option) => String(option.value) === String(current));
    return match?.label ?? String(current);
  });

  writeValue(value: SearchableSelectValue): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: SearchableSelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  get isDisabled(): boolean {
    return this.disabled() || this.disabledInput();
  }

  toggle(): void {
    if (this.isDisabled) return;
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.query.set('');
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    this.onTouched();
  }

  isSelected(option: SearchableSelectOption): boolean {
    const current = this.value();
    if (current == null || current === '') return false;
    return String(current) === String(option.value);
  }

  select(option: SearchableSelectOption): void {
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
  }

  clear(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isDisabled || !this.clearable()) return;
    this.value.set(null);
    this.onChange(null);
    this.onTouched();
  }

  onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.query.set(target?.value ?? '');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) return;
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
