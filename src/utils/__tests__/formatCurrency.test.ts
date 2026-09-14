import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../formatCurrency'

describe('formatCurrency', () => {
  it('formats zero correctly with currency symbol', () => {
    const formatted = formatCurrency(0)
    expect(formatted).toContain('0')
    expect(formatted).toContain('₫')
  })

  it('formats positive amount in VND format', () => {
    const formatted = formatCurrency(1250000)
    expect(formatted).toContain('1.250.000')
    expect(formatted).toContain('₫')
    expect(formatted).not.toContain('$')
  })

  it('handles null, undefined and NaN safely', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
    expect(formatCurrency(NaN)).toBe('—')
    expect(formatCurrency(null, { emptyText: 'Miễn phí' })).toBe('Miễn phí')
  })
})
