import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment';


const SECRET_KEY = environment.secretKey;

/**
 * Función para encriptar un string.
 * @param data String a encriptar.
 * @returns String encriptado.
 */
export const encrypt = (data: string): string => {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

/**
 * Función para desencriptar un string.
 * @param data String a desencriptar.
 * @returns String desencriptado.
 */
export const decrypt = (data: string): string => {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Función para encriptar un parámetro de ruta.
 * @param param Parámetro a encriptar.
 * @returns Parámetro encriptado.
 */
export const encryptRouteParam = (param: string): string => {
    let encryptedParam = encrypt(param);
    encryptedParam = encryptedParam.replace(/\//g, '-');
    return encryptedParam;
}

/**
 * Función para desencriptar un parámetro de ruta.
 * @param param Parámetro a desencriptar.
 * @returns Parámetro desencriptado.
 */
export const decryptRouteParam = (param: string): string => {
    let decryptedParam = param.replace(/-/g, '/');
    return decrypt(decryptedParam);
}