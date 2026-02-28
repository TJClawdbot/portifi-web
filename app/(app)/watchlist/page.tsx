'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AssetType, ASSET_TYPE_LABELS } from '@/lib/types'

interface WatchItem {
  id: string
  symbol: string
  name: string
  asset_type: AssetType
  price?: number
  change24h?: number
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [newSymbol, setNewSymbol] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadWatchlist()
  }, [])

  async function loadWatchlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id)
    setItems(data || [])
    setLoading(false)

    // Fetch prices for crypto items
    if (data && data.length > 0) {
      const cryptoIds = data.filter(i => i.asset_type === 'crypto').map(i => i.symbol.toLowerCase())
      if (cryptoIds.length > 0) {
        try {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`)
          const prices = await res.json()
          setItems(prev => prev.map(item => {
            const priceData = prices[item.symbol.toLowerCase()]
            if (priceData) return { ...item, price: priceData.usd, change24h: priceData.usd_24h_change }
            return item
          }))
        } catch {}
      }
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newSymbol.trim()) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('watchlist').insert({
      user_id: user!.id,
      symbol: newSymbol.trim().toUpperCase(),
      name: newName.trim() || newSymbol.trim().toUpperCase(),
      asset_type: 'stock',
    }).select().single()

    if (!error && data) {
      setItems(prev => [...prev, data])
      setNewSymbol('')
      setNewName('')
      toast({ title: 'Added to watchlist' })
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('watchlist').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleAddToHoldings(item: WatchItem) {
    window.location.href = `/holdings?add=${item.symbol}&name=${encodeURIComponent(item.name)}`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="text-[#8E8E93] text-sm">Track assets you're watching</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (AAPL, BTC...)"
          className="bg-[#13131A] border-[#2C2C3E] text-white placeholder:text-[#48484A] w-40"
        />
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Name (optional)"
          className="bg-[#13131A] border-[#2C2C3E] text-white placeholder:text-[#48484A] flex-1"
        />
        <Button type="submit" disabled={adding || !newSymbol.trim()} className="bg-[#0066FF] hover:bg-[#0055DD]">
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </form>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-[#48484A]">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[#48484A]">
          <p className="text-base">No assets on your watchlist</p>
          <p className="text-sm mt-1">Add tickers above to track them</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-[#13131A] border border-[#2C2C3E] rounded-xl px-4 py-3 hover:border-[#3C3C4E] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#1C1C2E] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#0066FF]">{item.symbol.slice(0, 3)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{item.name}</p>
                <p className="text-[#48484A] text-xs">{item.symbol}</p>
              </div>
              {item.price && (
                <div className="text-right">
                  <p className="text-white text-sm font-medium">${item.price.toLocaleString()}</p>
                  {item.change24h !== undefined && (
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${item.change24h >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                      {item.change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddToHoldings(item)}
                  className="p-1.5 rounded-lg text-[#48484A] hover:text-[#00C2A8] hover:bg-[#2C2C3E] transition-colors"
                  title="Add to holdings"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-[#48484A] hover:text-red-400 hover:bg-[#2C2C3E] transition-colors"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
