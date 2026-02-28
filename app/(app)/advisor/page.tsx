'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'How diversified am I?',
  "What's my biggest risk?",
  'How am I performing?',
  'What should I rebalance?',
]

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    const userMsg: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const newMessages = [...messages, userMsg]

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('Failed')

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // Streaming
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ''
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6))
                assistantContent += data.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                  return updated
                })
              } catch {}
            }
          }
        }
      } else {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#1C1C2E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">PortiFi Advisor</h1>
            <p className="text-xs text-[#8E8E93]">AI-powered portfolio insights</p>
          </div>
        </div>
        <p className="text-xs text-[#48484A] mt-3 px-3 py-2 bg-[#13131A] rounded-lg border border-[#2C2C3E]">
          ⚠️ For informational purposes only. Not financial advice.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066FF]/20 to-[#00C2A8]/20 border border-[#0066FF]/30 flex items-center justify-center mx-auto mb-3">
                <Bot size={28} className="text-[#0066FF]" />
              </div>
              <p className="text-white font-semibold">Ask me about your portfolio</p>
              <p className="text-[#8E8E93] text-sm mt-1">I have full context on your holdings</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 bg-[#13131A] border border-[#2C2C3E] rounded-xl text-sm text-[#8E8E93] hover:text-white hover:border-[#0066FF]/50 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#0066FF] text-white rounded-br-sm'
                : 'bg-[#13131A] border border-[#2C2C3E] text-[#F2F2F7] rounded-bl-sm'
            }`}>
              {msg.content || (loading && i === messages.length - 1 ? <span className="animate-pulse">●●●</span> : '')}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#1C1C2E] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-[#8E8E93]" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#1C1C2E]">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your portfolio..."
            disabled={loading}
            className="bg-[#13131A] border-[#2C2C3E] text-white placeholder:text-[#48484A] focus:border-[#0066FF]"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[#0066FF] hover:bg-[#0055DD] px-4"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}
