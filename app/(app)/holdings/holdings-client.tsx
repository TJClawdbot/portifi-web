'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Holding, AssetType, ASSET_TYPE_LABELS } from '@/lib/types'
import { enrichHoldings, formatCurrency, formatPercent, holdingsToCSV } from '@/lib/holdings'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Download, Upload, ArrowUpDown, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type SortField = 'name' | 'value' | 'gain_loss' | 'asset_type'
type SortDir = 'asc' | 'desc'

const ASSET_TYPES: AssetType[] = ['stock', 'crypto', 'real_estate', 'vehicle', 'alternative', 'metal', 'cash']

const emptyForm = {
  name: '', symbol: '', quantity: '', purchase_price: '', current_price: '', asset_type: 'stock' as AssetType
}

export default function HoldingsClient({ holdings: rawHoldings, userId }: { holdings: Holding[], userId: string }) {
  const [holdings, setHoldings] = useState(rawHoldings)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'value', dir: 'desc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editHolding, setEditHolding] = useState<Holding | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const enriched = enrichHoldings(holdings)

  const filtered = enriched.filter(h => {
    if (tab !== 'all' && h.asset_type !== tab) return false
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.symbol.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    let va: number | string = 0, vb: number | string = 0
    if (sort.field === 'name') { va = a.name; vb = b.name }
    else if (sort.field === 'value') { va = a.total_value; vb = b.total_value }
    else if (sort.field === 'gain_loss') { va = a.gain_loss_pct; vb = b.gain_loss_pct }
    else if (sort.field === 'asset_type') { va = a.asset_type; vb = b.asset_type }
    if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sort.dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  function toggleSort(field: SortField) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' })
  }

  function openAdd() {
    setEditHolding(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(h: Holding) {
    setEditHolding(h)
    setForm({
      name: h.name, symbol: h.symbol, quantity: String(h.quantity),
      purchase_price: String(h.purchase_price), current_price: String(h.current_price),
      asset_type: h.asset_type,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    const payload = {
      name: form.name, symbol: form.symbol.toUpperCase(),
      quantity: parseFloat(form.quantity), purchase_price: parseFloat(form.purchase_price),
      current_price: parseFloat(form.current_price), asset_type: form.asset_type,
    }

    if (editHolding) {
      const { error } = await supabase.from('holdings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editHolding.id)
      if (!error) {
        setHoldings(prev => prev.map(h => h.id === editHolding.id ? { ...h, ...payload } : h))
        toast({ title: 'Holding updated' })
      }
    } else {
      const { data, error } = await supabase.from('holdings').insert({ ...payload, user_id: userId }).select().single()
      if (!error && data) {
        setHoldings(prev => [data, ...prev])
        toast({ title: 'Holding added' })
      }
    }
    setLoading(false)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this holding?')) return
    const { error } = await supabase.from('holdings').delete().eq('id', id)
    if (!error) {
      setHoldings(prev => prev.filter(h => h.id !== id))
      toast({ title: 'Holding deleted' })
    }
  }

  function handleExport() {
    const csv = holdingsToCSV(holdings)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'portifi-holdings.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.csv')) return toast({ title: 'Please drop a CSV file', variant: 'destructive' })
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const rows = lines.slice(1).map(line => {
      const [name, symbol, asset_type, quantity, purchase_price, current_price] = line.split(',')
      return { name: name?.trim(), symbol: symbol?.trim().toUpperCase(), asset_type: asset_type?.trim() as AssetType,
        quantity: parseFloat(quantity), purchase_price: parseFloat(purchase_price), current_price: parseFloat(current_price || purchase_price), user_id: userId }
    }).filter(r => r.name && r.symbol && !isNaN(r.quantity))

    const { data, error } = await supabase.from('holdings').insert(rows).select()
    if (!error && data) {
      setHoldings(prev => [...data, ...prev])
      toast({ title: `Imported ${data.length} holdings` })
    }
  }, [userId, supabase, toast])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Holdings</h1>
          <p className="text-[#8E8E93] text-sm">{holdings.length} assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="border-[#2C2C3E] text-[#8E8E93] hover:text-white">
            <Download size={14} className="mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openAdd} className="bg-[#0066FF] hover:bg-[#0055DD]">
            <Plus size={14} className="mr-1.5" /> Add Holding
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#13131A] border border-[#2C2C3E] h-auto p-1 flex-wrap">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white text-[#8E8E93] text-xs">All</TabsTrigger>
          {ASSET_TYPES.map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white text-[#8E8E93] text-xs">
              {ASSET_TYPE_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484A]" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search holdings..."
          className="pl-9 bg-[#13131A] border-[#2C2C3E] text-white placeholder:text-[#48484A]"
        />
      </div>

      {/* CSV Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragOver ? 'border-[#0066FF] bg-[#0066FF]/5' : 'border-[#2C2C3E]'}`}
      >
        <Upload size={16} className="mx-auto mb-1 text-[#48484A]" />
        <p className="text-xs text-[#48484A]">Drop CSV to import (Name, Symbol, Type, Qty, Purchase Price, Current Price)</p>
      </div>

      {/* Table */}
      <div className="bg-[#13131A] border border-[#2C2C3E] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2C3E]">
              {[
                { label: 'Asset', field: 'name' as SortField },
                { label: 'Type', field: 'asset_type' as SortField },
                { label: 'Value', field: 'value' as SortField },
                { label: 'Gain/Loss', field: 'gain_loss' as SortField },
              ].map(col => (
                <th key={col.field} className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort(col.field)}
                    className="flex items-center gap-1 text-xs font-medium text-[#8E8E93] hover:text-white transition-colors"
                  >
                    {col.label} <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-[#8E8E93]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[#48484A] text-sm">
                {search ? 'No results found' : 'No holdings yet. Add your first one!'}
              </td></tr>
            ) : filtered.map(h => (
              <tr key={h.id} className="border-b border-[#1C1C2E] hover:bg-[#1C1C2E]/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1C1C2E] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#0066FF]">{h.symbol.slice(0,3)}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{h.name}</p>
                      <p className="text-[#48484A] text-xs">{h.symbol} · {h.quantity} units</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="border-[#2C2C3E] text-[#8E8E93] text-xs">
                    {ASSET_TYPE_LABELS[h.asset_type]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium">{formatCurrency(h.total_value)}</p>
                  <p className="text-[#48484A] text-xs">{formatCurrency(h.current_price)}/unit</p>
                </td>
                <td className="px-4 py-3">
                  <p className={`text-sm font-medium ${h.gain_loss >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                    {formatCurrency(h.gain_loss)}
                  </p>
                  <p className={`text-xs ${h.gain_loss >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                    {formatPercent(h.gain_loss_pct)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg text-[#48484A] hover:text-white hover:bg-[#2C2C3E] transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded-lg text-[#48484A] hover:text-red-400 hover:bg-[#2C2C3E] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#13131A] border-[#2C2C3E] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editHolding ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#8E8E93] text-xs">Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Apple Inc." className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white" />
              </div>
              <div>
                <Label className="text-[#8E8E93] text-xs">Symbol</Label>
                <Input value={form.symbol} onChange={e => setForm(f => ({...f, symbol: e.target.value.toUpperCase()}))}
                  placeholder="AAPL" className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white" />
              </div>
            </div>
            <div>
              <Label className="text-[#8E8E93] text-xs">Asset Type</Label>
              <select
                value={form.asset_type}
                onChange={e => setForm(f => ({...f, asset_type: e.target.value as AssetType}))}
                className="w-full mt-1 px-3 py-2 bg-[#1C1C2E] border border-[#2C2C3E] rounded-md text-white text-sm focus:outline-none focus:border-[#0066FF]"
              >
                {ASSET_TYPES.map(t => <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[#8E8E93] text-xs">Quantity</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))}
                  placeholder="10" className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white" />
              </div>
              <div>
                <Label className="text-[#8E8E93] text-xs">Buy Price</Label>
                <Input type="number" value={form.purchase_price} onChange={e => setForm(f => ({...f, purchase_price: e.target.value}))}
                  placeholder="150.00" className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white" />
              </div>
              <div>
                <Label className="text-[#8E8E93] text-xs">Current Price</Label>
                <Input type="number" value={form.current_price} onChange={e => setForm(f => ({...f, current_price: e.target.value}))}
                  placeholder="175.00" className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-[#2C2C3E] text-[#8E8E93]">Cancel</Button>
              <Button onClick={handleSave} disabled={loading || !form.name || !form.symbol} className="flex-1 bg-[#0066FF] hover:bg-[#0055DD]">
                {loading ? 'Saving...' : editHolding ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
