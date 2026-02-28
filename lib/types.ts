export type AssetType = 'stock' | 'crypto' | 'real_estate' | 'vehicle' | 'alternative' | 'metal' | 'cash'

export interface Holding {
  id: string
  user_id: string
  name: string
  symbol: string
  quantity: number
  purchase_price: number
  current_price: number
  asset_type: AssetType
  created_at: string
  updated_at: string
}

export interface HoldingWithValue extends Holding {
  total_value: number
  gain_loss: number
  gain_loss_pct: number
}

export interface WatchlistItem {
  id: string
  user_id: string
  symbol: string
  name: string
  asset_type: AssetType
  created_at: string
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  vehicle: 'Vehicles',
  alternative: 'Alternatives',
  metal: 'Metals',
  cash: 'Cash',
}

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  stock: '#0066FF',
  crypto: '#00C2A8',
  real_estate: '#FF6B35',
  vehicle: '#8B5CF6',
  alternative: '#F59E0B',
  metal: '#6B7280',
  cash: '#10B981',
}
