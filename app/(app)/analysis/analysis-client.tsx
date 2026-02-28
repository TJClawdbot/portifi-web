'use client'

import { Holding, ASSET_TYPE_COLORS, ASSET_TYPE_LABELS, AssetType } from '@/lib/types'
import { enrichHoldings, formatCurrency, formatPercent, totalPortfolioValue } from '@/lib/holdings'
// recharts imported selectively below as needed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Shield, DollarSign } from 'lucide-react'

export default function AnalysisClient({ holdings: rawHoldings }: { holdings: Holding[] }) {
  const holdings = enrichHoldings(rawHoldings)
  const totalVal = totalPortfolioValue(holdings)

  // Diversification score (0-100)
  const numTypes = new Set(holdings.map(h => h.asset_type)).size
  const maxConcentration = holdings.length > 0
    ? Math.max(...holdings.map(h => h.total_value / totalVal * 100))
    : 0
  const diversificationScore = Math.round(
    Math.min(100, (numTypes / 7) * 40 + (1 - maxConcentration / 100) * 40 + Math.min(holdings.length, 10) / 10 * 20)
  )

  // Allocation by type
  const allocationData = Object.entries(ASSET_TYPE_LABELS).map(([type, label]) => {
    const typeHoldings = holdings.filter(h => h.asset_type === type as AssetType)
    const value = typeHoldings.reduce((s, h) => s + h.total_value, 0)
    const pct = totalVal > 0 ? (value / totalVal) * 100 : 0
    return { name: label, value, pct, color: ASSET_TYPE_COLORS[type as AssetType] }
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  // Risk assessment
  const concentrationRisks = holdings
    .map(h => ({ name: h.name, pct: totalVal > 0 ? (h.total_value / totalVal) * 100 : 0 }))
    .filter(h => h.pct > 20)
    .sort((a, b) => b.pct - a.pct)

  // Tax analysis (simplified - holdings > 1 year are long term)
  const now = Date.now()
  const shortTerm = holdings.filter(h => now - new Date(h.created_at).getTime() < 365 * 24 * 3600 * 1000)
  const longTerm = holdings.filter(h => now - new Date(h.created_at).getTime() >= 365 * 24 * 3600 * 1000)
  const shortTermGains = shortTerm.reduce((s, h) => s + Math.max(0, h.gain_loss), 0)
  const longTermGains = longTerm.reduce((s, h) => s + Math.max(0, h.gain_loss), 0)

  // Benchmark comparison (mock S&P 500 performance)
  const spyReturn = 0.24 // 24% mock annual
  const portfolioReturn = totalVal > 0 && holdings.length > 0
    ? holdings.reduce((s, h) => s + h.gain_loss, 0) / holdings.reduce((s, h) => s + h.quantity * h.purchase_price, 0) * 100
    : 0

  const scoreColor = diversificationScore >= 70 ? '#00C2A8' : diversificationScore >= 40 ? '#F59E0B' : '#FF453A'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analysis</h1>
        <p className="text-[#8E8E93] text-sm">Deep portfolio insights</p>
      </div>

      {/* Score cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-[#0066FF]" />
              <p className="text-[#8E8E93] text-xs">Diversification</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: scoreColor }}>{diversificationScore}/100</p>
            <p className="text-xs text-[#48484A] mt-0.5">{numTypes} asset class{numTypes !== 1 ? 'es' : ''}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-[#00C2A8]" />
              <p className="text-[#8E8E93] text-xs">Portfolio Return</p>
            </div>
            <p className={`text-2xl font-bold ${portfolioReturn >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
            </p>
            <p className="text-xs text-[#48484A] mt-0.5">vs S&P {spyReturn > portfolioReturn/100 ? '↓' : '↑'} {(spyReturn*100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-[#F59E0B]" />
              <p className="text-[#8E8E93] text-xs">Concentration Risk</p>
            </div>
            <p className={`text-2xl font-bold ${maxConcentration > 50 ? 'text-red-400' : maxConcentration > 30 ? 'text-[#F59E0B]' : 'text-[#00C2A8]'}`}>
              {maxConcentration.toFixed(0)}%
            </p>
            <p className="text-xs text-[#48484A] mt-0.5">Largest position</p>
          </CardContent>
        </Card>
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-[#8B5CF6]" />
              <p className="text-[#8E8E93] text-xs">Unrealized Gains</p>
            </div>
            <p className={`text-2xl font-bold ${holdings.reduce((s,h) => s+h.gain_loss, 0) >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
              {formatCurrency(holdings.reduce((s, h) => s + h.gain_loss, 0), true)}
            </p>
            <p className="text-xs text-[#48484A] mt-0.5">Total gain/loss</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation breakdown */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="space-y-3">
                {allocationData.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm text-[#8E8E93]">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-white font-medium">{d.pct.toFixed(1)}%</span>
                        <span className="text-xs text-[#48484A] ml-2">{formatCurrency(d.value, true)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1C1C2E] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${d.pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#48484A] text-sm text-center py-8">No holdings to analyze</p>
            )}
          </CardContent>
        </Card>

        {/* Benchmark comparison */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Benchmark Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">Your Portfolio</p>
                  <p className="text-[#48484A] text-xs">Total return</p>
                </div>
                <p className={`text-xl font-bold ${portfolioReturn >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                  {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">S&P 500 (SPY)</p>
                  <p className="text-[#48484A] text-xs">12-month benchmark</p>
                </div>
                <p className="text-xl font-bold text-[#0066FF]">+{(spyReturn*100).toFixed(0)}%</p>
              </div>
              <div className={`p-3 rounded-xl ${portfolioReturn >= spyReturn*100 ? 'bg-[#00C2A8]/10 border border-[#00C2A8]/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <p className={`text-sm font-medium ${portfolioReturn >= spyReturn*100 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                  {portfolioReturn >= spyReturn*100
                    ? `▲ Outperforming by ${(portfolioReturn - spyReturn*100).toFixed(1)}%`
                    : `▼ Underperforming by ${(spyReturn*100 - portfolioReturn).toFixed(1)}%`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax impact */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Tax Impact Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">Short-Term Gains</p>
                  <p className="text-[#48484A] text-xs">{shortTerm.length} positions · &lt;1 year · Ordinary income rate</p>
                </div>
                <p className={`font-bold ${shortTermGains >= 0 ? 'text-[#F59E0B]' : 'text-[#00C2A8]'}`}>
                  {formatCurrency(shortTermGains, true)}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">Long-Term Gains</p>
                  <p className="text-[#48484A] text-xs">{longTerm.length} positions · &gt;1 year · 0-20% cap gains rate</p>
                </div>
                <p className={`font-bold ${longTermGains >= 0 ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                  {formatCurrency(longTermGains, true)}
                </p>
              </div>
              <p className="text-[#48484A] text-xs">* Estimates only. Consult a tax professional for accurate tax planning.</p>
            </div>
          </CardContent>
        </Card>

        {/* Concentration risk */}
        <Card className="bg-[#13131A] border-[#2C2C3E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Concentration Risk</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <p className="text-[#48484A] text-sm text-center py-8">No holdings to analyze</p>
            ) : (
              <div className="space-y-3">
                {concentrationRisks.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-xs">High concentration detected in {concentrationRisks.length} position{concentrationRisks.length > 1 ? 's' : ''}</p>
                    </div>
                    {concentrationRisks.map(r => (
                      <div key={r.name} className="flex items-center justify-between">
                        <span className="text-[#8E8E93] text-sm">{r.name}</span>
                        <span className="text-red-400 font-medium text-sm">{r.pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-[#00C2A8]/10 border border-[#00C2A8]/20 rounded-lg">
                    <Shield size={14} className="text-[#00C2A8] flex-shrink-0" />
                    <p className="text-[#00C2A8] text-xs">No single position exceeds 20% — good diversification!</p>
                  </div>
                )}
                <div className="pt-2 space-y-1.5">
                  {[...holdings].sort((a, b) => b.total_value - a.total_value).slice(0, 5).map(h => {
                    const pct = totalVal > 0 ? (h.total_value / totalVal) * 100 : 0
                    return (
                      <div key={h.id} className="flex items-center gap-3">
                        <span className="text-xs text-[#8E8E93] w-20 truncate">{h.symbol}</span>
                        <div className="flex-1 h-1.5 bg-[#1C1C2E] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: pct > 50 ? '#FF453A' : pct > 30 ? '#F59E0B' : '#0066FF' }}
                          />
                        </div>
                        <span className="text-xs text-[#8E8E93] w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
