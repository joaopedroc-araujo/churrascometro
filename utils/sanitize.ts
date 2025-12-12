/**
 * Utilitários para sanitização e validação de inputs
 */

/**
 * Sanitiza uma string removendo caracteres perigosos e limitando tamanho
 */
export function sanitizeString(input: string, maxLength = 100): string {
  return (
    input
      .trim()
      .replace(/[<>]/g, "") // Remove tags HTML
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove caracteres de controle
      .slice(0, maxLength)
  );
}

/**
 * Sanitiza e valida um preço
 * @returns número válido entre 0 e maxValue, ou 0 se inválido
 */
export function sanitizePrice(input: string, maxValue = 99999): number {
  const cleaned = input.replace(/[^0-9,.]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  if (parsed > maxValue) {
    return maxValue;
  }

  return Math.round(parsed * 100) / 100; // 2 casas decimais
}

/**
 * Sanitiza e valida uma quantidade inteira
 */
export function sanitizeQuantity(input: number, min = 0, max = 999): number {
  if (isNaN(input)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.floor(input)));
}

/**
 * Valida se um preço é válido
 */
export function isValidPrice(value: string): boolean {
  const price = sanitizePrice(value);
  return price > 0 && price <= 99999;
}

/**
 * Valida se um nome de item é válido
 */
export function isValidItemName(value: string): boolean {
  const sanitized = sanitizeString(value);
  return sanitized.length >= 2 && sanitized.length <= 50;
}

/**
 * Formata um preço para exibição (ex: "1.234,56")
 */
export function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string de preço BR para número
 */
export function parsePrice(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}
