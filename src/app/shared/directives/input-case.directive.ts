import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Normaliza en tiempo real los campos capturados por el usuario.
 * - email -> minúsculas
 * - campos text/search/password/textarea -> MAYÚSCULAS
 * - tel/number/date/file y demás tipos técnicos -> sin transformación
 */
@Directive({
  selector: 'input[appInputCase], textarea[appInputCase]',
  standalone: true
})
export class InputCaseDirective {
  private readonly element = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  onInput(): void {
    const native = this.element.nativeElement;
    const raw = native.value ?? '';
    const transformed = this.transform(raw, native);

    if (transformed === raw) return;

    const start = native.selectionStart;
    const end = native.selectionEnd;
    native.value = transformed;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(transformed, { emitEvent: true });
      this.ngControl.control.markAsDirty();
    }

    if (start !== null && end !== null && typeof native.setSelectionRange === 'function') {
      queueMicrotask(() => native.setSelectionRange(start, end));
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const native = this.element.nativeElement;
    const transformed = this.transform(native.value ?? '', native);
    if (transformed === native.value) return;

    native.value = transformed;
    this.ngControl?.control?.setValue(transformed, { emitEvent: true });
  }

  private transform(value: string, element: HTMLInputElement | HTMLTextAreaElement): string {
    if (element instanceof HTMLTextAreaElement) return value.toUpperCase();

    const type = (element.type || 'text').toLowerCase();
    if (type === 'email') return value.toLowerCase();

    // El captcha del login acepta únicamente 5 caracteres alfanuméricos.
    // Se normaliza aquí para cubrir escritura y pegado antes de llegar al FormControl.
    if (element.id === 'captcha') {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    }

    if (['text', 'search', 'password'].includes(type)) {
      return value.toUpperCase();
    }

    return value;
  }
}
