/**
 * Tipo de respuesta de la API
 */
export type ApiResponse<T> = {
    codigo: string;
    msg: string;
    body?: T;
}