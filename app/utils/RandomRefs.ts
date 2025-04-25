/**
 * Génère une chaîne aléatoire
 * @param length - Longueur de la chaîne
 * @param chars - Caractères à utiliser
 * @returns Une chaîne aléatoire
 */
export function randomString(length: number, chars: string): string {
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Génère une référence de paiement
 * @returns Une référence de paiement unique
 */
export function generatePayReference(): string {
  return randomString(9, '0123456789abcdefghijklmnopqrstuvwxyz');
}
