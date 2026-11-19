/**
 * Función que transforma el texto de un input a mayúsculas inmediatamente
 * @param event Evento de teclado
 * @returns void
 */
export const transformInputToUpperCase = (event: KeyboardEvent, maxLength?: number) => {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement || !event.key) return;

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