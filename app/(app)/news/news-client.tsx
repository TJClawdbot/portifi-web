'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  source: { name: string }
}

export default function NewsClient({ symbols }: { symbols: string[] }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const mockArticles: NewsArticle[] = [
    {
      title: "Markets Rally as Fed Signals Potential Rate Cuts",
      description: "Stock markets surged on Wednesday after Federal Reserve officials hinted at potential interest rate reductions later this year, boosting investor confidence.",
      url: "https://finance.yahoo.com",
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      source: { name: "Reuters" }
    },
    {
      title: "Bitcoin Surpasses $60,000 as Institutional Demand Grows",
      description: "Bitcoin has crossed the $60,000 mark once again as institutional investors continue to pour money into crypto assets amid growing mainstream adoption.",
      url: "https://coindesk.com",
      urlToImage: null,
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      source: { name: "CoinDesk" }
    },
    {
      title: "Real Estate Market Shows Signs of Cooling in Major Cities",
      description: "Housing prices in major metropolitan areas have begun to stabilize as higher mortgage rates dampen buyer enthusiasm.",
      url: "https://zillow.com",
      urlToImage: null,
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      source: { name: "Bloomberg" }
    },
    {
      title: "S&P 500 Hits New All-Time High Driven by Tech Stocks",
      description: "The S&P 500 index reached a record high today, driven primarily by gains in technology companies and positive earnings reports.",
      url: "https://wsj.com",
      urlToImage: null,
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      source: { name: "Wall Street Journal" }
    },
    {
      title: "Gold Prices Rise Amid Global Economic Uncertainty",
      description: "Gold and precious metals are seeing increased demand as investors seek safe-haven assets amid geopolitical tensions and market volatility.",
      url: "https://kitco.com",
      urlToImage: null,
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      source: { name: "Kitco" }
    },
    {
      title: "Ethereum Network Upgrade Promises Lower Gas Fees",
      description: "The latest Ethereum protocol upgrade aims to significantly reduce transaction costs while improving network scalability and performance.",
      url: "https://ethereum.org",
      urlToImage: null,
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      source: { name: "CoinTelegraph" }
    },
  ]

  useEffect(() => {
    // In production, replace with actual NewsAPI call using NEWSAPI_KEY
    setTimeout(() => {
      setArticles(mockArticles)
      setLoading(false)
    }, 500)
  }, [])

  const tabs = ['all', ...symbols.slice(0, 6)]

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor(diff / 60000)
    if (hrs > 24) return `${Math.floor(hrs/24)}d ago`
    if (hrs > 0) return `${hrs}h ago`
    return `${mins}m ago`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">News</h1>
          <p className="text-[#8E8E93] text-sm">Financial news relevant to your holdings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500) }}
          className="border-[#2C2C3E] text-[#8E8E93] hover:text-white"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === t ? 'bg-[#0066FF] text-white' : 'bg-[#13131A] text-[#8E8E93] hover:text-white border border-[#2C2C3E]'
            }`}
          >
            {t === 'all' ? 'All News' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#13131A] border border-[#2C2C3E] rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-[#2C2C3E] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#2C2C3E] rounded w-full mb-1" />
              <div className="h-3 bg-[#2C2C3E] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#13131A] border border-[#2C2C3E] rounded-xl p-4 hover:border-[#3C3C4E] transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug group-hover:text-[#0066FF] transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  {article.description && (
                    <p className="text-[#8E8E93] text-xs mt-1.5 line-clamp-2">{article.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#48484A] text-xs">{article.source.name}</span>
                    <span className="text-[#3C3C4E] text-xs">·</span>
                    <span className="text-[#48484A] text-xs">{timeAgo(article.publishedAt)}</span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#48484A] group-hover:text-[#0066FF] flex-shrink-0 mt-0.5 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
