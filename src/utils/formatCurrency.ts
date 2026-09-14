/**
 * Utility helper to format currency consistently across the platform.
 * Formats numbers into Vietnamese Đồng (VND / ₫) style.
 */

export interface FormatCurrencyOptions {
  emptyText?: string
}

export function formatCurrency(
  value: number | null | undefined,
  options?: FormatCurrencyOptions
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return options?.emptyText ?? '—'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
