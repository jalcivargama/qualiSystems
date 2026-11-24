/**
 * Función que transforma el texto de un input a mayúsculas inmediatamente
 * @param event Evento de teclado
 * @returns void
 */
export const transformInputToUpperCase = (event: KeyboardEvent, maxLength?: number) => {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement || !event.key) return;

    // Permitir atajos (pegar, copiar, cortar, seleccionar, etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;

    if (event.key.length === 1) { // Solo para caracteres imprimibles
        event.preventDefault();

        // Verificar si agregar un carácter excedería el maxLength
        if (maxLength) {
            const currentLength = inputElement.value.length;
            const selectedLength = end - start; // Cantidad de texto que será reemplazado
            const newLength = currentLength - selectedLength + 1;
            
            // Si excede el límite, no permitir la entrada
            if (newLength > maxLength) return;            
        }

        const newChar = event.key.toUpperCase();
        const value = inputElement.value;
        inputElement.value = value.slice(0, start) + newChar + value.slice(end);
        inputElement.setSelectionRange(start + 1, start + 1);
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Función que transforma el texto de un input a minúsculas inmediatamente
 * @param event Evento de teclado
 * @returns void
 */
export const transformInputToLowerCase = (event: KeyboardEvent, maxLength?: number) => {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement || !event.key) return;

    // Permitir atajos (pegar, copiar, cortar, seleccionar, etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;

    if (event.key.length === 1) { // Solo para caracteres imprimibles
        event.preventDefault();

        if (maxLength) {
            const currentLength = inputElement.value.length;
            const selectedLength = end - start;
            const newLength = currentLength - selectedLength + 1;

            if (newLength > maxLength) return;
        }

        const newChar = event.key.toLowerCase();
        const value = inputElement.value;
        inputElement.value = value.slice(0, start) + newChar + value.slice(end);
        inputElement.setSelectionRange(start + 1, start + 1);
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Normaliza texto pegado a minúsculas respetando maxLength.
 */
export const transformPasteToLowerCase = (event: ClipboardEvent, maxLength?: number) => {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement) return;

    event.preventDefault();

    let pasted = (event.clipboardData?.getData('text') ?? '').toLowerCase();
    if (!pasted) return;

    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;
    const value = inputElement.value;

    if (maxLength) {
        const available = maxLength - (value.length - (end - start));
        if (available <= 0) return;
        pasted = pasted.slice(0, available);
    }

    inputElement.value = value.slice(0, start) + pasted + value.slice(end);
    const caret = start + pasted.length;
    inputElement.setSelectionRange(caret, caret);
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
}