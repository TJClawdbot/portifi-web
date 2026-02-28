import { Holding, HoldingWithValue } from './types'

export function enrichHoldings(holdings: Holding[]): HoldingWithValue[] {
  return holdings.map(h => {
    const total_value = h.quantity * h.current_price
    const cost_basis = h.quantity * h.purchase_price
    const gain_loss = total_value - cost_basis
    const gain_loss_pct = cost_basis > 0 ? (gain_loss / cost_basis) * 100 : 0
    return { ...h, total_value, gain_loss, gain_loss_pct }
  })
}

export function totalPortfolioValue(holdings: HoldingWithValue[]): number {
  return holdings.reduce((sum, h) => sum + h.total_value, 0)
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
  if (compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function holdingsToCSV(holdings: Holding[]): string {
  const headers = ['Name', 'Symbol', 'Type', 'Quantity', 'Purchase Price', 'Current Price', 'Total Value', 'Gain/Loss']
  const rows = holdings.map(h => {
    const total = h.quantity * h.current_price
    const gainLoss = total - h.quantity * h.purchase_price
    return [h.name, h.symbol, h.asset_type, h.quantity, h.purchase_price, h.current_price, total.toFixed(2), gainLoss.toFixed(2)]
  })
  return [headers, ...rows].map(r => r.join(',')).join('\n')
}
