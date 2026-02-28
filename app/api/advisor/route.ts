import { createClient } from '@/lib/supabase/server'
import { enrichHoldings, formatCurrency, totalPortfolioValue } from '@/lib/holdings'
import { ASSET_TYPE_LABELS } from '@/lib/types'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  // Fetch holdings for context
  const { data: rawHoldings } = await supabase.from('holdings').select('*').eq('user_id', user.id)
  const holdings = enrichHoldings(rawHoldings || [])
  const totalVal = totalPortfolioValue(holdings)

  // Build portfolio summary
  const allocationByType: Record<string, number> = {}
  holdings.forEach(h => {
    const label = ASSET_TYPE_LABELS[h.asset_type] || h.asset_type
    allocationByType[label] = (allocationByType[label] || 0) + h.total_value
  })

  const topHoldings = [...holdings].sort((a, b) => b.total_value - a.total_value).slice(0, 5)

  const portfolioContext = `
Portfolio Summary:
- Total Value: ${formatCurrency(totalVal)}
- Number of Holdings: ${holdings.length}
- Allocation: ${Object.entries(allocationByType).map(([k, v]) => `${k}: ${formatCurrency(v)} (${totalVal > 0 ? ((v/totalVal)*100).toFixed(1) : 0}%)`).join(', ')}
- Top Holdings: ${topHoldings.map(h => `${h.name} (${h.symbol}) - ${formatCurrency(h.total_value)}, ${h.gain_loss >= 0 ? '+' : ''}${h.gain_loss_pct.toFixed(2)}% gain/loss`).join('; ')}
`

  const systemPrompt = `You are PortiFi Advisor, an AI financial assistant with access to the user's portfolio data.

${portfolioContext}

Provide helpful, specific advice based on this data. Be concise and actionable. Always include a brief disclaimer that this is for informational purposes only and not financial advice.`

  if (!process.env.OPENAI_API_KEY) {
    // Mock response when no API key
    const mockResponse = `Based on your portfolio${totalVal > 0 ? ` valued at ${formatCurrency(totalVal)}` : ''}, here's my analysis:\n\n${messages[messages.length-1]?.content?.includes('diversif') ? 'Your portfolio diversification looks reasonable. Consider spreading across more asset classes to reduce risk.' : 'I can help you analyze your portfolio performance, diversification, risk exposure, and rebalancing opportunities.\n\nTo get personalized advice, ask me about:\n- Portfolio diversification\n- Risk assessment\n- Rebalancing suggestions\n- Performance analysis'}\n\n*For informational purposes only. Not financial advice.*`
    
    return new Response(JSON.stringify({ content: mockResponse }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}
