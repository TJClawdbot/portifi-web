'use client'

import { useState } from 'react'
import { Holding, ASSET_TYPE_COLORS, ASSET_TYPE_LABELS, AssetType } from '@/lib/types'
import { enrichHoldings, formatCurrency, formatPercent, totalPortfolioValue } from '@/lib/holdings'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TimeRange = '7d' | '30d' | '1y'

function generateMockHistory(holdings: ReturnType<typeof enrichHoldings>, range: TimeRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const totalVal = totalPortfolioValue(holdings)
  const points = []
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const noise = (Math.random() - 0.5) * 0.04
    const trend = (days - i) / days * 0.08
    points.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(0, totalVal * (1 - 0.08 + trend + noise))
    })
  }
  return points
}

export default function DashboardClient({ holdings: rawHoldings }: { holdings: Holding[] }) {
  const [hideBalance, setHideBalance] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const holdings = enrichHoldings(rawHoldings)
  const totalValue = totalPortfolioValue(holdings)

  // Mock 24h change
  const change24h = totalValue * 0.012
  const change24hPct = 1.2

  // Allocation by type
  const allocationData = Object.entries(ASSET_TYPE_LABELS).map(([type, label]) => {
    const typeHoldings = holdings.filter(h => h.asset_type === type as AssetType)
    const value = typeHoldings.reduce((s, h) => s + h.total_value, 0)
    return { name: label, value, color: ASSET_TYPE_COLORS[type as AssetType] }
  }).filter(d => d.value > 0)

  const historyData = generateMockHistory(holdings, timeRange)

  // Top movers
  const sorted = [...holdings].sort((a, b) => Math.abs(b.gain_loss_pct) - Math.abs(a.gain_loss_pct))
  const topMovers = sorted.slice(0, 5)

  const maskValue = (val: string) => hideBalance ? '••••••' : val

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#8E8E93] text-sm mt-0.5">Your portfolio overview</p>
        </div>
        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition-colors text-sm"
        >
          {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          {hideBalance ? 'Show' : 'Hide'}
        </button>
      </div>

      {/* Total Value Hero */}
      <Card className="bg-gradient-to-br from-[#0066FF]/20 to-[#00C2A8]/10 border-[#0066FF]/30 card-glow">
        <CardContent className="pt-6 pb-6">
          <p className="text-[#8E8E93] text-sm mb-1">Total Portfolio Value</p>
          <p className="text-5xl font-bold text-white mb-2">{maskValue(formatCurrency(totalValue))}</p>
          <div className={`flex items-center gap-1.5 ${change24h >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
            {change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="font-medium">{maskValue(formatCurrency(change24h))}</span>
            <span className="text-sm">({formatPercent(change24hPct)} today)</span>
          </div>
          {holdings.length === 0 && (
            <p className="text-[#48484A] text-sm mt-3">No holdings yet. <a href="/holdings" className="text-[#0066FF] hover:underline">Add your first holding →</a></p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Performance</CardTitle>
              <div className="flex gap-1">
                {(['7d', '30d', '1y'] as TimeRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      timeRange === r ? 'bg-[#0066FF] text-white' : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historyData}>
                <XAxis dataKey="date" tick={{ fill: '#48484A', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#48484A', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: '#1C1C2E', border: '1px solid #2C2C3E', borderRadius: 8, color: '#fff' }}
                  formatter={(v: unknown) => [formatCurrency(v as number), 'Value']}
                />
                <Line type="monotone" dataKey="value" stroke="#0066FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Allocation Chart */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                      {allocationData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1C1C2E', border: '1px solid #2C2C3E', borderRadius: 8, color: '#fff' }}
                      formatter={(v: unknown) => [formatCurrency(v as number), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {allocationData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-[#8E8E93]">{d.name}</span>
                      </div>
                      <span className="text-white font-medium">
                        {maskValue(totalValue > 0 ? `${((d.value / totalValue) * 100).toFixed(1)}%` : '0%')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[#48484A] text-sm">No holdings yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Movers */}
      {topMovers.length > 0 && (
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Top Movers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMovers.map(h => (
                <div key={h.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1C1C2E] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#0066FF]">{h.symbol.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{h.name}</p>
                      <p className="text-[#48484A] text-xs">{h.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{maskValue(formatCurrency(h.total_value))}</p>
                    <p className={`text-xs font-medium ${h.gain_loss >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                      {maskValue(formatPercent(h.gain_loss_pct))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
