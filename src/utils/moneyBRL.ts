export function formatBRLFromCents(cents: number): string {
  const safe = Number.isFinite(Number(cents)) ? Number(cents) : 0
  const value = safe / 100

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Converte um input digitado (ex: "10,00" / "1000" / "R$ 10,00")
 * para cents (int). Ex:
 *  - "1000" -> 1000
 *  - "10,00" -> 1000
 *  - "R$ 100,20" -> 10020
 *
 * Regra: pega só dígitos e interpreta como "cents".
 */
export function parseBRLToCents(input: string): number {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return 0
  return parseInt(digits, 10)
}
